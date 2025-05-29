"use client"
import type React from "react"
import { Editor } from "@tinymce/tinymce-react"
import { useEffect, useState } from "react"
import Loading from "@/components/myui/loading"


interface TextEditorProps {
  initialValue?: string
  onChange?: (content: string) => void
}

const TextEditorTiny: React.FC<TextEditorProps> = ({ initialValue = "", onChange }) => {
  const [mounted, setMounted] = useState(false)
  const handleEditorChange = (content: string) => {
    if (onChange) {
      onChange(content)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Loading />
  }

  return (
    <Editor
      apiKey='53grbb1btwvkcwe2ea9lnesl6cz9z0o0f021ekdu8eu9oekj'
      init={{
        plugins: [
          // Core editing features
          'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
          // Your account includes a free trial of TinyMCE premium features
          // Try the most popular premium features until Mar 4, 2025:
          'checklist', 'mediaembed', 'casechange', 'export', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate', 'ai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        tinycomments_mode: 'embedded',
        tinycomments_author: 'Author name',
        mergetags_list: [
          { value: 'First.Name', title: 'First Name' },
          { value: 'Email', title: 'Email' },
        ],
        ai_request: (request: any, respondWith: any) => respondWith.string(() => Promise.reject('..,')),
      }}
      initialValue={initialValue}
    />
  )
}

export default TextEditorTiny

