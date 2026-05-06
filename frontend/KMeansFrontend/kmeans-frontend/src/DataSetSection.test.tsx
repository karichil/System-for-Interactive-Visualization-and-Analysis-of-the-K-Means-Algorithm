import { fireEvent, render, screen } from "@testing-library/react";
import ManualEditing from "./components/ControlPanel/ManualEditing";
import { EditMode, IDataSetDto } from "./types/interfaces";

const dataset: IDataSetDto = {
    points: [{ x: 1, y: 2, clusterId: 0 }],
};

const renderComponent = (overrides = {}) => {
    const props = {
        editMode: null as EditMode,
        setEditMode: jest.fn(),
        dataset: null as IDataSetDto | null,
        finalDataSet: [],
        ...overrides,
    };

    render(<ManualEditing {...props} />);

    return props;
};

describe("ManualEditing", () => {
    test("renders manual editing title", () => {
        renderComponent();

        expect(screen.getByText(/manual editing/i)).toBeInTheDocument();
    });

    test("renders points button", () => {
        renderComponent();

        expect(
            screen.getByRole("button", { name: "Points" })
        ).toBeInTheDocument();
    });

    test("renders centroids button", () => {
        renderComponent();

        expect(
            screen.getByRole("button", { name: "Centroids" })
        ).toBeInTheDocument();
    });

    test("renders add hint text", () => {
        renderComponent();

        expect(screen.getByText(/click to add/i)).toBeInTheDocument();
    });

    test("renders move hint text", () => {
        renderComponent();

        expect(screen.getByText(/drag to move/i)).toBeInTheDocument();
    });

    test("renders delete hint text", () => {
        renderComponent();

        expect(screen.getByText(/right click to delete/i)).toBeInTheDocument();
    });

    test("disables points button when dataset is null", () => {
        renderComponent({ dataset: null });

        expect(
            screen.getByRole("button", { name: "Points" })
        ).toBeDisabled();
    });

    test("enables points button when dataset exists", () => {
        renderComponent({ dataset });

        expect(
            screen.getByRole("button", { name: "Points" })
        ).toBeEnabled();
    });

    test("disables points button when algorithm results exist", () => {
        renderComponent({
            dataset,
            finalDataSet: dataset.points,
        });

        expect(
            screen.getByRole("button", { name: "Points" })
        ).toBeDisabled();
    });

    test("calls setEditMode with Points after clicking points button", () => {
        const { setEditMode } = renderComponent({ dataset });

        fireEvent.click(screen.getByRole("button", { name: "Points" }));

        expect(setEditMode).toHaveBeenCalledWith("Points");
    });

    test("calls setEditMode with null when points mode is already active", () => {
        const { setEditMode } = renderComponent({
            dataset,
            editMode: "Points" as EditMode,
        });

        fireEvent.click(screen.getByRole("button", { name: "Points" }));

        expect(setEditMode).toHaveBeenCalledWith(null);
    });

    test("calls setEditMode with Centroids after clicking centroids button", () => {
        const { setEditMode } = renderComponent({ dataset });

        fireEvent.click(screen.getByRole("button", { name: "Centroids" }));

        expect(setEditMode).toHaveBeenCalledWith("Centroids");
    });

    test("calls setEditMode with null when centroids mode is already active", () => {
        const { setEditMode } = renderComponent({
            dataset,
            editMode: "Centroids" as EditMode,
        });

        fireEvent.click(screen.getByRole("button", { name: "Centroids" }));

        expect(setEditMode).toHaveBeenCalledWith(null);
    });

    test("renders exactly two buttons", () => {
        renderComponent();

        const buttons = screen.getAllByRole("button");

        expect(buttons).toHaveLength(2);
    });

    test("setEditMode is not called without interaction", () => {
        const { setEditMode } = renderComponent({ dataset });

        expect(setEditMode).not.toHaveBeenCalled();
    });
});