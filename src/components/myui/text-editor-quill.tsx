"use client";
import React, { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css"; // Import du thème CSS de Quill
import { useTranslations } from "next-intl";

const TextEditor = ({ id, value, onChange }: { id?: string, value?: string, onChange?: any }) => {
    const quillRef = useRef<HTMLDivElement | null>(null);
    const [content, setContent] = useState<string>("");
    const placeholder = useTranslations("TextEditor")

    useEffect(() => {
        const Quill = require("quill").default;
        // const ImageResize = require("quill-image-resize").default;
        const Widget = require("quill-table-widget").default;

        // Quill.register("modules/imageResize", ImageResize);
        Quill.register("modules/tableWidget", Widget);

        const quill = new Quill(quillRef.current, {
            theme: "snow",
            modules: {
                toolbar: [
                    [{ font: ["Cario", "serif", "sans-serif", "monospace"] }],
                    [{ size: ["small", false, "large", "huge"] }],
                    [{ color: [] }, { background: [] }],
                    [{ header: "1" }, { header: "2" }, { header: "3" }],
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ align: [] }],
                    ["link", "image", "video"],
                    ["clean"],
                ],
                imageResize: {
                    modules: ["Resize", "DisplaySize"],
                },
                table: true,
                tableWidget: {
                    toolbarOffset: -1,
                    maxSize: [20, 20],
                },
            },
            placeholder: placeholder("placeholder"),
        });

        quill.root.innerHTML = value;

        quill.on("text-change", () => {
            setContent(quill.root.innerHTML);
            if (onchange)
                onChange(quill.root.innerHTML)
        });

        //@ts-ignore
        quillRef.current!.quill = quill;

        return () => {
            quill.off("text-change");
        };
    }, []);

    return (
        <div>
            <div className="bg-white p-2 border border-white rounded-md text-black" dir="ltr">
                <div ref={quillRef} style={{ height: "300px" }} />
                <div id={id ?? "editor-content"} className="hidden">
                    <div className='' dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            </div>
        </div>
    );
};

export default TextEditor;


{/* <style>
    {`td, th, tr, table {
                            border-collapse: collapse;
                            border: 1px solid hsl(var(--border));
                        }
                        table {
                            width: 100%;
                        }
                        .ql-align-center{
                            text-align: center;
                        }
                        .ql-align-right,.ql-editor .ql-align-right{
                            text-align : ${locale === "ar" ? "left" : "right"};
                        }
                        .ql-align-left{
                            text-align : ${locale === "ar" ? "right" : "left"};
                        }
                        p{
                        text-align : ${locale === "ar" ? "right" : "left"};
                        }
                        .ql-editor.ql-blank{
                            text-align : ${locale === "ar" ? "right" : "left"};
                        }
                    `}
</style> */}