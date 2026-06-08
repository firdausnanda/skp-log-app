"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import RhkTab from "@/components/RhkTab";

export default function RhkPage() {
  const { triggerNotification } = useApp();

  return <RhkTab onNotification={triggerNotification} />;
}
