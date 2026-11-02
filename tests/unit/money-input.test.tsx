import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { MoneyInput } from "@/components/ui/money-input";

afterEach(() => {
  cleanup();
});

describe("MoneyInput Component", () => {
  it("formats initial value with proper commas", () => {
    render(<MoneyInput value="1008000232" data-testid="money-input" />);
    const input = screen.getByTestId("money-input") as HTMLInputElement;
    expect(input.value).toBe("1,00,80,00,232");
  });

  it("formats entered numbers live and emits clean decimal string", () => {
    let cleanVal = "";
    function TestWrapper() {
      const [val, setVal] = React.useState("");
      return (
        <MoneyInput
          value={val}
          onChange={(e) => {
            cleanVal = e.target.value;
            setVal(e.target.value);
          }}
          data-testid="money-input"
        />
      );
    }

    render(<TestWrapper />);
    const input = screen.getByTestId("money-input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "1008000232" } });
    expect(input.value).toBe("1,00,80,00,232");
    expect(cleanVal).toBe("1008000232");
  });

  it("handles decimal numbers properly", () => {
    function TestWrapper() {
      const [val, setVal] = React.useState("");
      return (
        <MoneyInput
          value={val}
          onChange={(e) => setVal(e.target.value)}
          data-testid="money-input"
        />
      );
    }

    render(<TestWrapper />);
    const input = screen.getByTestId("money-input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "150000.50" } });
    expect(input.value).toBe("1,50,000.50");
  });

  it("handles negative values when allowNegative is enabled", () => {
    function TestWrapper() {
      const [val, setVal] = React.useState("");
      return (
        <MoneyInput
          allowNegative
          value={val}
          onChange={(e) => setVal(e.target.value)}
          data-testid="money-input"
        />
      );
    }

    render(<TestWrapper />);
    const input = screen.getByTestId("money-input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "-25000" } });
    expect(input.value).toBe("-25,000");
  });

  it("updates display when external value prop changes", () => {
    const { rerender } = render(<MoneyInput value="50000" data-testid="money-input" />);
    const input = screen.getByTestId("money-input") as HTMLInputElement;
    expect(input.value).toBe("50,000");

    rerender(<MoneyInput value="22323232" data-testid="money-input" />);
    expect(input.value).toBe("2,23,23,232");
  });

  it("handles backspace immediately after comma by deleting preceding digit", () => {
    let current = "";
    function TestWrapper() {
      const [val, setVal] = React.useState("15000");
      return (
        <MoneyInput
          value={val}
          onChange={(e) => {
            current = e.target.value;
            setVal(e.target.value);
          }}
          data-testid="money-input"
        />
      );
    }

    render(<TestWrapper />);
    const input = screen.getByTestId("money-input") as HTMLInputElement;
    expect(input.value).toBe("15,000");

    // Position cursor after comma (index 3 in "15,000")
    input.setSelectionRange(3, 3);
    fireEvent.keyDown(input, { key: "Backspace" });

    // Should delete '5' before the comma, leaving '1000' -> '1,000'
    expect(input.value).toBe("1,000");
    expect(current).toBe("1000");
  });
});
