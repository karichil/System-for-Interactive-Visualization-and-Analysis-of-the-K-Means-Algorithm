import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DataSetSection from "./components/ControlPanel/DataSetSection";
import axios from "axios";

console.log("DATASET TEST RUNNING");

jest.mock("axios");

const mockSetBaseDataSet = jest.fn();
const mockSetIsModified = jest.fn();

const props = {
    setBaseDataSet: mockSetBaseDataSet,
    isModified: false,
    setIsModified: mockSetIsModified,
    dataset: null,
    finalDataSet: []
};

describe("DataSetSection", () => {

    beforeEach(() => {
        jest.clearAllMocks();

        (axios.get as jest.Mock).mockResolvedValue({ data: [] });
        (axios.delete as jest.Mock).mockResolvedValue({});
    });

    test("renders Data title", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByText("Data")).toBeInTheDocument();
    });

    test("upload text visible", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
    });

    test("example data visible", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByText(/example data/i)).toBeInTheDocument();
    });

    test("reset button works", () => {
        render(<DataSetSection {...props} />);
        fireEvent.click(screen.getByText(/reset/i));
        expect(mockSetBaseDataSet).toHaveBeenCalledWith(null);
    });

    test("example select triggers axios", async () => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: {
                headers: ["x", "y"],
                processedData: [[1, 2]]
            }
        });

        render(<DataSetSection {...props} />);

        fireEvent.change(screen.getAllByRole("combobox")[0], {
            target: { value: "grid" }
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });
    });

    test("error shown when axios fails", async () => {
        (axios.get as jest.Mock).mockRejectedValue({});

        render(<DataSetSection {...props} />);

        fireEvent.change(screen.getAllByRole("combobox")[0], {
            target: { value: "grid" }
        });

        expect(await screen.findByText(/failed/i)).toBeInTheDocument();
    });

    test("axis labels visible", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByText("X-Axis")).toBeInTheDocument();
        expect(screen.getByText("Y-Axis")).toBeInTheDocument();
    });

    test("three selects exist", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getAllByRole("combobox").length).toBe(3);
    });

    test("axis selects disabled initially", () => {
        render(<DataSetSection {...props} />);
        const selects = screen.getAllByRole("combobox");

        const roots = screen.getAllByRole("combobox").map(el => el.parentElement);

        expect(roots[1]).toHaveAttribute("disabled");
        expect(roots[2]).toHaveAttribute("disabled");
    });

    test("grid option exists", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByText("Grid")).toBeInTheDocument();
    });

    test("reset button visible", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    test("heading exists", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
    });

    test("file input exists", () => {
        render(<DataSetSection {...props} />);
        expect(document.querySelector("input")).toBeTruthy();
    });

    test("no error initially", () => {
        render(<DataSetSection {...props} />);
        expect(screen.queryByText(/failed/i)).toBeNull();
    });

    test("options count > 2", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getAllByRole("option").length).toBeGreaterThan(2);
    });

    test("example select exists", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getAllByRole("combobox")[0]).toBeInTheDocument();
    });

    test("X select exists", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getAllByRole("combobox")[1]).toBeInTheDocument();
    });

    test("Y select exists", () => {
        render(<DataSetSection {...props} />);
        expect(screen.getAllByRole("combobox")[2]).toBeInTheDocument();
    });

    test("default select value", () => {
        render(<DataSetSection {...props} />);
        const value = (screen.getAllByRole("combobox")[0] as HTMLSelectElement).value;

        expect(value).toBe("grid");
    });

    test("spinner not visible initially", () => {
        render(<DataSetSection {...props} />);
        expect(screen.queryByText(/loading/i)).toBeNull();
    });

    test("multiple renders do not crash", () => {
        render(<DataSetSection {...props} />);
        render(<DataSetSection {...props} />);
    });

    test("reset clears dataset state", () => {
        render(<DataSetSection {...props} />);
        fireEvent.click(screen.getByText(/reset/i));
        expect(mockSetIsModified).toHaveBeenCalledWith(false);
    });
});