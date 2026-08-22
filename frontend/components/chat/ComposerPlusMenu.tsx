"use client";

import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, FileUp, MapPin, Plus } from "lucide-react";
import styles from "./ComposerPlusMenu.module.css";

type ComposerPlusMenuProps = Readonly<{
  onSelectCalendarEvent?: () => void;
  onSelectSavedAddress?: () => void;
  onFileSelected?: (file: File) => void;
}>;

export function ComposerPlusMenu({
  onSelectCalendarEvent,
  onSelectSavedAddress,
  onFileSelected,
}: ComposerPlusMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected?.(file);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger suppressHydrationWarning className={styles.trigger}>
          <Plus size={18} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className={styles.menu}>
          <DropdownMenuItem className={styles.item} onClick={onSelectCalendarEvent}>
            <Calendar size={15} className={styles.itemIcon} />
            <div>
              <span className={styles.itemLabel}>Calendar Event</span>
              <p className={styles.itemDesc}>Search your Google Calendar</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className={styles.item} onClick={onSelectSavedAddress}>
            <MapPin size={15} className={styles.itemIcon} />
            <div>
              <span className={styles.itemLabel}>Saved Address</span>
              <p className={styles.itemDesc}>Attach a saved location</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className={styles.item} onClick={() => fileInputRef.current?.click()}>
            <FileUp size={15} className={styles.itemIcon} />
            <div>
              <span className={styles.itemLabel}>Upload File</span>
              <p className={styles.itemDesc}>Attach a PDF or image</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
