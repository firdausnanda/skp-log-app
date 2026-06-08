"use client";

import React, { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { id } from "react-day-picker/locale";
import "react-day-picker/style.css";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  id?: string;
}

export default function DatePicker({ value, onChange, id: inputId }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    
    // Defer state updates to prevent warning about synchronous state changes inside effect body
    const frameId = requestAnimationFrame(() => {
      handleResize();
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      // For mobile mode, modal click is handled separately by backdrop
      if (isMobile) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isMobile]);

  // Safe timezone parsing: prevents YYYY-MM-DD from converting to UTC and shifting day.
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDate = value ? parseDateString(value) : new Date();

  // Format date for button display in Indonesian
  const getFormattedLabel = () => {
    if (!value) return "Pilih Tanggal";
    try {
      const dateObj = parseDateString(value);
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatDateToString(date));
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative w-full" ref={containerRef} id={inputId}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 text-left font-body-md text-on-surface text-sm flex items-center justify-between hover:border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all select-none"
      >
        <span className="truncate" suppressHydrationWarning>{getFormattedLabel()}</span>
        <span className="material-symbols-outlined text-primary text-[20px] select-none shrink-0 ml-2">
          calendar_today
        </span>
      </button>

      {/* Popover/Modal content */}
      {isOpen && (
        <>
          {isMobile ? (
            // Mobile Center Modal with Backdrop
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] animate-fade-in">
              {/* Overlay Backdrop close handler */}
              <div className="absolute inset-0 cursor-pointer" onClick={() => setIsOpen(false)} />
              
              {/* Modal Card */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-4 max-w-[340px] w-full loader-card-enter z-50 flex flex-col items-center">
                <div className="w-full flex items-center justify-between border-b border-outline-variant pb-2.5 mb-3">
                  <span className="font-headline-md text-sm text-on-surface font-bold">Pilih Tanggal</span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  locale={id}
                />
              </div>
            </div>
          ) : (
            // Desktop Dropdown
            <div className="absolute top-full left-0 mt-1.5 z-50 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 loader-card-enter w-fit">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                locale={id}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
