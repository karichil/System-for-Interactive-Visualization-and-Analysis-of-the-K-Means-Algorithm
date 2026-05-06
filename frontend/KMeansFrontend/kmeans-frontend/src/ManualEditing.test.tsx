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
    describe("rendering", () => {
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

        test("renders editing hints", () => {
            renderComponent();

            expect(screen.getByText(/click to add/i)).toBeInTheDocument();
            expect(screen.getByText(/drag to move/i)).toBeInTheDocument();
            expect(
                screen.getByText(/right click to delete/i)
            ).toBeInTheDocument();
        });
    });

    describe("points button state", () => {
        test("disables points button when dataset is null", () => {
            renderComponent({ dataset: null });

            expect(
                screen.getByRole("button", { name: "Points" })
            ).toBeDisabled();
        });

        test("enables points button when dataset contains points", () => {
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
    });

    describe("points editing mode", () => {
        test("activates points editing mode after clicking points button", () => {
            const { setEditMode } = renderComponent({ dataset });

            fireEvent.click(
                screen.getByRole("button", { name: "Points" })
            );

            expect(setEditMode).toHaveBeenCalledWith("Points");
        });

        test("clears points editing mode when points mode is already active", () => {
            const { setEditMode } = renderComponent({
                dataset,
                editMode: "Points" as EditMode,
            });

            fireEvent.click(
                screen.getByRole("button", { name: "Points" })
            );

            expect(setEditMode).toHaveBeenCalledWith(null);
        });
    });

    describe("centroids editing mode", () => {
        test("activates centroids editing mode after clicking centroids button", () => {
            const { setEditMode } = renderComponent({ dataset });

            fireEvent.click(
                screen.getByRole("button", { name: "Centroids" })
            );

            expect(setEditMode).toHaveBeenCalledWith("Centroids");
        });

        test("clears centroids editing mode when centroids mode is already active", () => {
            const { setEditMode } = renderComponent({
                dataset,
                editMode: "Centroids" as EditMode,
            });

            fireEvent.click(
                screen.getByRole("button", { name: "Centroids" })
            );

            expect(setEditMode).toHaveBeenCalledWith(null);
        });
    });
});