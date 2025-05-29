"use client"
import React from "react";

const HtmlRenderer = ({ htmlContentParam }: any) => {

    return (
        <div dangerouslySetInnerHTML={{ __html: htmlContentParam }} />
    );
};

export default HtmlRenderer;
