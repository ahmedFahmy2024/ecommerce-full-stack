"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateButtonProps {
  label: string;
  onClick: () => void;
}

export function CreateButton({ label, onClick }: CreateButtonProps) {
  return (
    <Button size="sm" onClick={onClick}>
      <PlusIcon />
      {label}
    </Button>
  );
}
