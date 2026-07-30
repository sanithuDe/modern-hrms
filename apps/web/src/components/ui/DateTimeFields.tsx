"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export function splitDateTime(value: string): {
  date: string;
  time: string;
} {
  if (!value) {
    return { date: "", time: "" };
  }

  const [datePart, timePart = ""] = value.split("T");
  return {
    date: datePart ?? "",
    time: timePart.slice(0, 5),
  };
}

export function joinDateTime(date: string, time: string): string {
  if (!date) {
    return "";
  }

  return `${date}T${time || "09:00"}`;
}

function parseDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const parsed = parseDateKey(value);
  if (!parsed) {
    return "Select date";
  }

  return parsed.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function to12HourLabel(time24: string): string {
  if (!time24) {
    return "9:00 AM";
  }

  const [rawHour = "9", rawMinute = "00"] = time24.split(":");
  let hour = Number(rawHour);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${rawMinute.slice(0, 2).padStart(2, "0")} ${period}`;
}

function formatDisplayDateTime(value: string): string {
  const { date, time } = splitDateTime(value);
  if (!date) {
    return "Select date & time";
  }

  return `${formatDisplayDate(date)} · ${to12HourLabel(time)}`;
}

function formatSummary(date: string, time: string): string {
  const parsed = parseDateKey(date);
  if (!parsed) {
    return "No date selected";
  }

  const day = parsed.getDate();
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });
  const year = parsed.getFullYear();

  return `${day} ${month} ${year} ${to12HourLabel(time || "09:00")}`;
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${String(hours).padStart(2, "0")}:${minutes}`;
});

function nearestTimeSlot(time: string): string {
  if (!time) {
    return "09:00";
  }

  const [rawHour = "9", rawMinute = "00"] = time.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (minute < 15) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  if (minute < 45) {
    return `${String(hour).padStart(2, "0")}:30`;
  }

  return `${String((hour + 1) % 24).padStart(2, "0")}:00`;
}

function useOutsideClose(
  open: boolean,
  refs: Array<React.RefObject<HTMLElement | null>>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const inside = refs.some(
        (ref) => ref.current && ref.current.contains(target),
      );
      if (!inside) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onClose, refs]);
}

function useFixedPopover(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  popoverRef: React.RefObject<HTMLElement | null>,
  width: number,
) {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 80,
    width,
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    function update() {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const panelWidth = Math.min(width, window.innerWidth - 24);
      const panelHeight =
        popoverRef.current?.offsetHeight || 420;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const openUp =
        spaceBelow < panelHeight && rect.top > spaceBelow + gap;

      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - panelWidth - 12);
      }
      left = Math.max(12, left);

      let top = openUp
        ? rect.top - panelHeight - gap
        : rect.bottom + gap;

      if (top + panelHeight > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - panelHeight - 12);
      }
      top = Math.max(12, top);

      setStyle({
        position: "fixed",
        top,
        left,
        zIndex: 80,
        width: panelWidth,
      });
    }

    update();
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, triggerRef, popoverRef, width]);

  return style;
}

function TriggerButton({
  buttonRef,
  open,
  empty,
  children,
  icons,
  onClick,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  empty: boolean;
  children: React.ReactNode;
  icons: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition",
        open
          ? "border-[var(--brand)]"
          : "border-slate-300 hover:border-slate-400",
      ].join(" ")}
    >
      <span className={empty ? "text-slate-400" : "font-medium text-slate-900"}>
        {children}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-slate-400">
        {icons}
      </span>
    </button>
  );
}

function CalendarGrid({
  value,
  minDate,
  onChange,
}: {
  value: string;
  minDate?: string;
  onChange: (date: string) => void;
}) {
  const selected = parseDateKey(value);
  const min = minDate ? parseDateKey(minDate) : null;
  const [view, setView] = useState<Date>(
    () => selected ?? min ?? new Date(),
  );

  useEffect(() => {
    if (selected) {
      setView(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [value]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());

  const cells: Array<{
    key: string;
    label: number;
    inMonth: boolean;
    disabled: boolean;
  }> = [];

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const key = formatDateKey(cellDate);
    const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const disabled = Boolean(min && cellDate < min);

    cells.push({
      key,
      label: cellDate.getDate(),
      inMonth,
      disabled,
    });
  }

  const monthLabel = view.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full min-w-[16.5rem]">
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell) => {
          const isSelected = value === cell.key && cell.inMonth;
          const isToday = cell.key === todayKey && cell.inMonth && !isSelected;

          return (
            <button
              key={cell.key + String(cell.inMonth)}
              type="button"
              disabled={cell.disabled || !cell.inMonth}
              onClick={() => onChange(cell.key)}
              className={[
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                !cell.inMonth
                  ? "pointer-events-none text-slate-300"
                  : cell.disabled
                    ? "cursor-not-allowed text-slate-300"
                    : isSelected
                      ? "bg-[var(--brand)] font-semibold text-white"
                      : isToday
                        ? "font-semibold text-[var(--brand)] ring-1 ring-[var(--brand)]/30"
                        : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              {cell.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeList({
  value,
  onChange,
}: {
  value: string;
  onChange: (time: string) => void;
}) {
  const selected = nearestTimeSlot(value);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedRef.current || !listRef.current) {
      return;
    }

    const list = listRef.current;
    const item = selectedRef.current;
    list.scrollTop =
      item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
  }, [selected]);

  return (
    <div className="flex h-[17.5rem] w-[7.75rem] shrink-0 flex-col border-l border-slate-200 pl-3">
      <div
        ref={listRef}
        className="h-full overflow-y-auto pr-1 [scrollbar-width:thin]"
      >
        {TIME_SLOTS.map((slot) => {
          const active = slot === selected;
          return (
            <button
              key={slot}
              ref={active ? selectedRef : undefined}
              type="button"
              onClick={() => onChange(slot)}
              className={[
                "mb-0.5 w-full rounded-lg px-2.5 py-2 text-left text-sm whitespace-nowrap transition",
                active
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {to12HourLabel(slot)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
  minDate,
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const min = minDate ? parseDateKey(minDate) : null;
  const popoverStyle = useFixedPopover(open, buttonRef, popoverRef, 304);

  useEffect(() => {
    setMounted(true);
  }, []);

  useOutsideClose(open, [rootRef, popoverRef], () => setOpen(false));

  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      ) : null}

      <div ref={rootRef} className="relative w-full">
        <TriggerButton
          buttonRef={buttonRef}
          open={open}
          empty={!value}
          icons={<CalendarDays size={16} />}
          onClick={() => setOpen((current) => !current)}
        >
          {formatDisplayDate(value)}
        </TriggerButton>

        {mounted && open
          ? createPortal(
              <div
                ref={popoverRef}
                style={popoverStyle}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <CalendarGrid
                  value={value}
                  minDate={minDate}
                  onChange={(next) => {
                    onChange(next);
                    setOpen(false);
                  }}
                />

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                    className="text-sm text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = formatDateKey(new Date());
                      if (min && parseDateKey(today)! < min) {
                        return;
                      }
                      onChange(today);
                      setOpen(false);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Today
                  </button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
  onClear,
  minDate,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { date: committedDate, time: committedTime } = splitDateTime(value);

  const [draftDate, setDraftDate] = useState(
    committedDate || formatDateKey(new Date()),
  );
  const [draftTime, setDraftTime] = useState(
    nearestTimeSlot(committedTime || "09:00"),
  );

  const popoverStyle = useFixedPopover(open, buttonRef, popoverRef, 420);

  useEffect(() => {
    setMounted(true);
  }, []);

  useOutsideClose(open, [rootRef, popoverRef], () => setOpen(false));

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftDate(committedDate || formatDateKey(new Date()));
    setDraftTime(nearestTimeSlot(committedTime || "09:00"));
  }, [open, committedDate, committedTime]);

  function handleCancel() {
    setOpen(false);
  }

  function handleSchedule() {
    if (!draftDate) {
      return;
    }

    onChange(joinDateTime(draftDate, draftTime));
    setOpen(false);
  }

  function handleClear() {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div ref={rootRef} className="relative w-full">
        <TriggerButton
          buttonRef={buttonRef}
          open={open}
          empty={!value}
          icons={
            <>
              <CalendarDays size={15} />
              <Clock3 size={15} />
            </>
          }
          onClick={() => setOpen((current) => !current)}
        >
          {formatDisplayDateTime(value)}
        </TriggerButton>

        {mounted && open
          ? createPortal(
              <div
                ref={popoverRef}
                style={popoverStyle}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                <div className="flex gap-0 p-4">
                  <CalendarGrid
                    value={draftDate}
                    minDate={minDate}
                    onChange={setDraftDate}
                  />
                  <TimeList value={draftTime} onChange={setDraftTime} />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>

                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                      {formatSummary(draftDate, draftTime)}
                    </span>
                    <button
                      type="button"
                      onClick={handleSchedule}
                      className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}
