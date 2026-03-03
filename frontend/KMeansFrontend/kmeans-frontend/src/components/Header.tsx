import { Box, Heading, Image, Text } from "@chakra-ui/react";
import React from "react";

export default function Header() {
    return (
        <Box className="App-nav">
            <Image className="App-logo" src="KMeansFullLogo.png"></Image>
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="flex-start" alignSelf="stretch" >
                <Heading className="App-header">K-Means Interactive Lab</Heading>
                <Text className="App-thesis">Interactive visualization and analysis of the K-means clustering algorithm</Text>
            </Box>
        </Box>
    );
}