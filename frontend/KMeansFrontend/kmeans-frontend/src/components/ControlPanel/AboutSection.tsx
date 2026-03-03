import {
    Box,
    Button,
    Image,
    Text,
    Dialog,
    CloseButton,
    Portal, Separator
} from "@chakra-ui/react";
import React from "react";

export default function AboutSection() {
        return (
           <Dialog.Root>
                <Dialog.Trigger asChild>
                    <Button
                        className={"App-button"}
                        variant={"outline"}
                    >
                        <Image src="/icons/info.svg"/> About & Methodology
                    </Button>
                </Dialog.Trigger>
                <Portal>
                    <Dialog.Backdrop/>
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>K-Means Interactive Lab</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body gap={"8px"} flexDirection={"column"}>
                             <Box gap={"16px"} flexDirection={"column"} display={"flex"}>
                                <Box>
                                    <Text className="App-dialog-text-header">Engineering Thesis Context</Text>
                                    <Text className="App-dialog-text">
                                        This interactive system demonstrates the K-means clustering algorithm through
                                        real time visualization, step by step execution, and comprehensive quality metrics
                                        analysis. Built for educational and research purposes.
                                    </Text>
                                </Box>
                                             <Separator
                                                 orientation="horizontal"
                                                 width="100%"
                                                 borderColor="rgba(0, 0, 0, 0.2)"/>
                                <Box>
                                    <Text className="App-dialog-text-header">Algorithm Overview</Text>
                                    <Text className={"App-dialog-text"}>
                                        K-means partitions data into k clusters by iteratively:<br/>
                                        1) Assigning points to nearest centroids,<br/>
                                        2) Updating centroids to cluster centers,<br/>
                                        3) Repeating until convergence.
                                    </Text>
                                </Box>
                                             <Separator
                                                 orientation="horizontal"
                                                 width="100%"
                                                 borderColor="rgba(0, 0, 0, 0.2)"/>
                                <Box>
                                    <Text className="App-dialog-text-header">Distance Metrics</Text>
                                    <ul className="App-dialog-text">
                                        <li>• <strong>Euclidean:</strong> Standard geometric distance</li>
                                        <li>• <strong>Manhattan:</strong> Sum of absolute differences</li>
                                    </ul>
                                </Box>
                                             <Separator
                                                 orientation="horizontal"
                                                 width="100%"
                                                 borderColor="rgba(0, 0, 0, 0.2)"/>

                                <Box>
                                    <Text className="App-dialog-text-header">Quality Metrics</Text>
                                    <ul className="App-dialog-text">
                                        <li>• <strong>Elbow method:</strong> Picking the elbow of the curve as a best  number of clusters to use</li>
                                        <li>• <strong>Silhouette:</strong> Separation quality (-1 to 1, higher better)</li>
                                        <li>• <strong>Calinski-Harabasz:</strong> Between/within cluster variance ratio (higher better)</li>
                                    </ul>
                                </Box>
                            </Box>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                </Dialog.ActionTrigger>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm"/>
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        );
}