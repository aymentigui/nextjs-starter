"use client";

import DivStart from "@/components/my/public/div-start";
import HeaderPublic from "@/components/my/public/header";

export default function Home() {


  return (
    <div className="h-full w-full">
      Hi.. how you doing
      <DivStart />
      {/* Header */}
      <HeaderPublic />
      <HeaderPublic />
      <div className="h-[2000px]"></div>
    </div>
  );
}
