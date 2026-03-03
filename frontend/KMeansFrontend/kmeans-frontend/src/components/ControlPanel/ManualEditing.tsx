import {Box, Button, Image, Text} from "@chakra-ui/react";
import React from "react";
import {EditMode, IDataPointDto, IDataSetDto} from "../../types/interfaces";

interface ManualEditingProps {
    editMode: EditMode;
    setEditMode: (mode: EditMode) => void;
    dataset: IDataSetDto | null;
    finalDataSet: IDataPointDto[];
}


export default function ManualEditing({ editMode, setEditMode, dataset, finalDataSet }: ManualEditingProps) {

    const hasResults = finalDataSet && finalDataSet.length > 0;
    const hasNoData = !dataset || !dataset.points || dataset.points.length === 0;

    const isEditingAllowed = !(hasResults || hasNoData);
    return (
        <Box className={"App-group-box"}>
            <Box className={"App-title-icon-box"}>
                <Image src="/icons/manual.svg"/>
                <Text className={"App-text-md"}> Manual editing</Text>
            </Box>
            <Box flexDirection="row" display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} gap={"8px"}>

                <Button
                    className={"App-button"}
                    flex={"1"}
                    variant={editMode === 'Points' ? "solid" : "outline"}
                    colorScheme={editMode === 'Points' ? "blue" : "gray"}
                    onClick={() => setEditMode(editMode === 'Points' ? null : 'Points')}
                    disabled={!isEditingAllowed}>
                    Points
                </Button>

                <Button
                    className={"App-button"}
                    flex={"1"}
                    variant={editMode === 'Centroids' ? "solid" : "outline"}
                    colorScheme={editMode === 'Centroids' ? "blue" : "gray"}
                    onClick={() => setEditMode(editMode === 'Centroids' ? null : 'Centroids')}>
                    Centroids
                </Button>
            </Box>
            <Box className={"App-info-box"} alignSelf={"stretch"}>
                <Text className={"App-text-xs"}>• Click to add</Text>
                <Text className={"App-text-xs"}>• Drag to move</Text>
                <Text className={"App-text-xs"}>• Right click to delete</Text>
            </Box>
        </Box>
    );
}