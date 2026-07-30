"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectFieldBase {
  label?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SelectOption[];
  emptyMessage?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  triggerClassName?: string;
}

interface SingleSelectProps extends SelectFieldBase {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends SelectFieldBase {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SelectFieldProps = SingleSelectProps | MultiSelectProps;

function useOutsideClose(
  open: boolean,
  onClose: () => void,
  refs: Array<RefObject<HTMLElement | null>>,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) {
        return;
      }
      onClose();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, refs]);
}

function highlightMatch(label: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (!trimmed) {
    return label;
  }

  const lowerLabel = label.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerLabel.indexOf(lowerQuery);

  if (index < 0) {
    return label;
  }

  const before = label.slice(0, index);
  const match = label.slice(index, index + trimmed.length);
  const after = label.slice(index + trimmed.length);

  return (
    <>
      {before}
      <span className="font-semibold text-slate-900">{match}</span>
      {after}
    </>
  );
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition",
        checked
          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
          : "border-slate-300 bg-white",
      ].join(" ")}
      aria-hidden
    >
      {checked ? <Check size={11} strokeWidth={3} /> : null}
    </span>
  );
}

function placePanel(
  trigger: HTMLElement,
  panel: HTMLElement,
) {
  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const width = rect.width;
  const panelHeight = panel.offsetHeight || 200;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const openUp =
    spaceBelow < panelHeight && rect.top - gap > spaceBelow;

  const top = openUp
    ? Math.max(8, rect.top - panelHeight - gap)
    : rect.bottom + gap;

  panel.style.position = "fixed";
  panel.style.top = `${top}px`;
  panel.style.left = `${rect.left}px`;
  panel.style.width = `${width}px`;
  panel.style.minWidth = `${width}px`;
  panel.style.maxWidth = `${width}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.zIndex = "100";
  panel.style.margin = "0";
  panel.style.transform = "none";
}

export function SelectField(props: SelectFieldProps) {
  const {
    label,
    required,
    placeholder = "Select",
    searchPlaceholder = "Search",
    options,
    emptyMessage = "No options found",
    disabled = false,
    searchable = true,
    className = "",
    triggerClassName = "",
  } = props;

  const multiple = props.multiple === true;
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useOutsideClose(
    open,
    () => {
      setOpen(false);
      setQuery("");
    },
    [triggerRef, panelRef],
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function update() {
      if (!triggerRef.current || !panelRef.current) {
        return;
      }
      placePanel(triggerRef.current, panelRef.current);
    }

    update();
    const frame = window.requestAnimationFrame(update);
    const frame2 = window.requestAnimationFrame(update);

    const observer =
      typeof ResizeObserver !== "undefined" && panelRef.current
        ? new ResizeObserver(update)
        : null;
    if (panelRef.current && observer) {
      observer.observe(panelRef.current);
    }

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(frame2);
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, query, options.length]);

  useEffect(() => {
    if (open && searchable) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  const selectedValues = useMemo(() => {
    if (multiple) {
      return new Set(props.value);
    }
    return new Set(props.value ? [props.value] : []);
  }, [multiple, props.value]);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.has(option.value)),
    [options, selectedValues],
  );

  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const list =
      searchable && trimmed
        ? options.filter(
            (option) =>
              option.label.toLowerCase().includes(trimmed) ||
              option.description?.toLowerCase().includes(trimmed),
          )
        : options;

    const selected = list.filter((option) => selectedValues.has(option.value));
    const rest = list.filter((option) => !selectedValues.has(option.value));
    return { selected, rest, all: [...selected, ...rest] };
  }, [options, query, selectedValues, searchable]);

  function openMenu() {
    if (disabled) {
      return;
    }
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  function clearSearch(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    setQuery("");
    inputRef.current?.focus();
  }

  function clearSelection(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    if (multiple) {
      props.onChange([]);
    } else {
      props.onChange("");
    }
    setQuery("");
    if (searchable) {
      inputRef.current?.focus();
    }
  }

  function toggleOption(option: SelectOption) {
    if (option.disabled) {
      return;
    }

    if (multiple) {
      const next = selectedValues.has(option.value)
        ? props.value.filter((item) => item !== option.value)
        : [...props.value, option.value];
      props.onChange(next);
      return;
    }

    props.onChange(option.value);
    closeMenu();
  }

  const displayText = multiple
    ? selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`
    : selectedOptions[0]?.label || placeholder;

  const showSearch = open && searchable;
  const hasCustomTrigger = Boolean(triggerClassName.trim());

  function setPanelNode(node: HTMLDivElement | null) {
    panelRef.current = node;
    if (node && triggerRef.current) {
      placePanel(triggerRef.current, node);
    }
  }

  return (
    <div className={className || undefined}>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}

      <div
        ref={triggerRef}
        className={[
          "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 shadow-none outline-none transition",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          hasCustomTrigger
            ? triggerClassName
            : "border-slate-300 bg-white hover:border-slate-400",
          open && !hasCustomTrigger
            ? "border-[var(--brand)]"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => {
          if (!open) {
            openMenu();
          }
        }}
      >
        {showSearch ? (
          <Search size={15} className="shrink-0 text-slate-400" />
        ) : null}

        {showSearch ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            placeholder={
              selectedOptions[0]?.label || searchPlaceholder
            }
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const first = filteredOptions.all.find(
                  (item) => !item.disabled,
                );
                if (first) {
                  toggleOption(first);
                }
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            onClick={openMenu}
            className="min-w-0 flex-1 truncate text-left outline-none"
          >
            <span
              className={[
                "block truncate text-sm",
                selectedValues.size > 0
                  ? hasCustomTrigger
                    ? "font-semibold"
                    : "font-medium text-slate-900"
                  : "text-slate-400",
              ].join(" ")}
            >
              {displayText}
            </span>
            {!multiple && selectedOptions[0]?.description ? (
              <span className="mt-0.5 block truncate text-xs opacity-70">
                {selectedOptions[0].description}
              </span>
            ) : null}
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={
            showSearch && query
              ? "Clear search"
              : open
                ? "Close"
                : "Open"
          }
          onClick={(event) => {
            event.stopPropagation();
            if (showSearch && query) {
              clearSearch(event);
              return;
            }
            if (!open && selectedValues.size > 0 && !required) {
              clearSelection(event);
              return;
            }
            if (open) {
              closeMenu();
            } else {
              openMenu();
            }
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 transition hover:bg-black/5 hover:opacity-100"
        >
          {showSearch && query ? (
            <X size={14} />
          ) : open ? (
            <ChevronDown size={14} className="rotate-180" />
          ) : selectedValues.size > 0 && !required ? (
            <X size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              ref={setPanelNode}
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-none"
            >
              <div className="max-h-56 overflow-y-auto p-1.5">
                {filteredOptions.all.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">
                    {emptyMessage}
                  </p>
                ) : multiple ? (
                  <>
                    {filteredOptions.selected.map((option) => (
                      <OptionRow
                        key={option.value}
                        option={option}
                        query={query}
                        checked
                        multiple
                        onToggle={toggleOption}
                      />
                    ))}

                    {filteredOptions.selected.length > 0 &&
                    filteredOptions.rest.length > 0 ? (
                      <div className="my-1.5 border-t border-slate-100" />
                    ) : null}

                    {filteredOptions.rest.map((option) => (
                      <OptionRow
                        key={option.value}
                        option={option}
                        query={query}
                        checked={false}
                        multiple
                        onToggle={toggleOption}
                      />
                    ))}
                  </>
                ) : (
                  filteredOptions.all.map((option) => (
                    <OptionRow
                      key={option.value}
                      option={option}
                      query={query}
                      checked={selectedValues.has(option.value)}
                      multiple={false}
                      onToggle={toggleOption}
                    />
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function OptionRow({
  option,
  query,
  checked,
  multiple,
  onToggle,
}: {
  option: SelectOption;
  query: string;
  checked: boolean;
  multiple: boolean;
  onToggle: (option: SelectOption) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={checked}
      disabled={option.disabled}
      onClick={() => onToggle(option)}
      className={[
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition",
        option.disabled
          ? "cursor-not-allowed opacity-50"
          : checked
            ? "bg-[var(--brand-soft)]/80"
            : "hover:bg-slate-50",
      ].join(" ")}
    >
      {multiple ? <CheckboxMark checked={checked} /> : null}
      <span className="min-w-0 flex-1">
        <span
          className={[
            "block truncate text-sm",
            checked ? "font-semibold text-slate-900" : "text-slate-700",
          ].join(" ")}
        >
          {highlightMatch(option.label, query)}
        </span>
        {option.description ? (
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {highlightMatch(option.description, query)}
          </span>
        ) : null}
      </span>
      {!multiple && checked ? (
        <Check size={16} className="shrink-0 text-[var(--brand)]" />
      ) : null}
    </button>
  );
}
