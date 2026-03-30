import "@testing-library/jest-dom";
import React from "react";

const createElement = (tag: any = "div") => {
    return (props: any) => {
        const { children, ...rest } = props || {};

        const cleanProps: any = {};

        Object.keys(rest).forEach((key) => {
            const forbidden = [
                "flexDirection",
                "justifyContent",
                "alignItems",
                "alignSelf",
                "flexShrink",
                "borderRadius",
                "minH",
                "gap",
                "width",
                "display",
                "flex",
                "asChild"
            ];

            if (!forbidden.includes(key)) {
                cleanProps[key] = rest[key];
            }
        });

        return React.createElement(tag, cleanProps, children);
    };
};

jest.mock("./components/ui/toaster", () => ({
    toaster: {
        info: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
    }
}));

jest.mock("@chakra-ui/react", () => {

    const passthrough = (tag: any = "div") => createElement(tag);

    return {
        Box: passthrough("div"),
        Button: passthrough("button"),
        Heading: passthrough("h1"),
        Text: passthrough("span"),
        Image: passthrough("img"),
        Icon: passthrough("span"),
        Spinner: passthrough("div"),
        CloseButton: passthrough("button"),
        Portal: passthrough("div"),

        Alert: {
            Root: passthrough("div"),
            Indicator: passthrough("div"),
        },

        Popover: {
            Root: passthrough("div"),
            Trigger: passthrough("div"),
            Positioner: passthrough("div"),
            Content: passthrough("div"),
            Arrow: passthrough("div"),
            Body: passthrough("div"),
        },

        FileUpload: {
            Root: ({ children }: any) => <div>{children}</div>,
            HiddenInput: (props: any) => <input {...props} />,
            Dropzone: passthrough("div"),
            DropzoneContent: passthrough("div"),
            List: passthrough("div"),
        },

        NativeSelect: {
            Root: ({ children, ...props }: any) => (
                <div {...props}>{children}</div>
            ),
            Field: ({ children, ...props }: any) => (
                <select {...props}>{children}</select>
            ),
            Indicator: () => null,
        },
    };

});