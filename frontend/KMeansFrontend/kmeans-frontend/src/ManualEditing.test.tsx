import { render, screen } from "@testing-library/react";
import ManualEditing from "./components/ControlPanel/ManualEditing";

console.log("MANUAL TEST RUNNING");

const defaultProps = {
    editMode: null,
    setEditMode: jest.fn(),
    dataset: null,
    finalDataSet: [],
};

describe("ManualEditing", () => {

    test("renders title", () => {
        render(<ManualEditing {...defaultProps} />);
        expect(screen.getByText(/manual editing/i)).toBeInTheDocument();
    });

    test("buttons disabled when no dataset", () => {
        render(<ManualEditing {...defaultProps} dataset={null} />);
        expect(screen.getByText("Points")).toBeDisabled();
    });

    test("buttons enabled when dataset exists", () => {
        render(<ManualEditing {...defaultProps} dataset={{ points: [{ x: 1, y: 2, clusterId: 0 }] }} />);
        expect(screen.getByText("Points")).not.toBeDisabled();
    });

    test("Points button visible", () => {
        render(<ManualEditing {...defaultProps} />);
        expect(screen.getByText("Points")).toBeInTheDocument();
    });

    test("Centroids button visible", () => {
        render(<ManualEditing {...defaultProps} />);
        expect(screen.getByText(/centroid/i)).toBeInTheDocument();
    });

    test("component renders without crash", () => {
        render(<ManualEditing {...defaultProps} />);
    });

    test("multiple renders safe", () => {
        render(<ManualEditing {...defaultProps} />);
        render(<ManualEditing {...defaultProps} />);
    });

    test("no dataset handled", () => {
        render(<ManualEditing {...defaultProps} dataset={null} />);
        expect(screen.getByText("Points")).toBeDisabled();
    });

});