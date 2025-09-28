"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNew, setWaitingForNew] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNew) {
      setDisplay(num);
      setWaitingForNew(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNew(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNew(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNew(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🧮 계산기</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <Card>
          <div className="space-y-4">
            {/* Display */}
            <div className="bg-gray-100 p-4 rounded-lg text-right">
              <div className="text-3xl font-mono">{display}</div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button variant="secondary" onClick={clear} className="col-span-2">
                Clear
              </Button>
              <Button variant="outline" onClick={() => inputOperation("÷")}>
                ÷
              </Button>
              <Button variant="outline" onClick={() => inputOperation("×")}>
                ×
              </Button>

              <Button variant="outline" onClick={() => inputNumber("7")}>
                7
              </Button>
              <Button variant="outline" onClick={() => inputNumber("8")}>
                8
              </Button>
              <Button variant="outline" onClick={() => inputNumber("9")}>
                9
              </Button>
              <Button variant="outline" onClick={() => inputOperation("-")}>
                -
              </Button>

              <Button variant="outline" onClick={() => inputNumber("4")}>
                4
              </Button>
              <Button variant="outline" onClick={() => inputNumber("5")}>
                5
              </Button>
              <Button variant="outline" onClick={() => inputNumber("6")}>
                6
              </Button>
              <Button variant="outline" onClick={() => inputOperation("+")}>
                +
              </Button>

              <Button variant="outline" onClick={() => inputNumber("1")}>
                1
              </Button>
              <Button variant="outline" onClick={() => inputNumber("2")}>
                2
              </Button>
              <Button variant="outline" onClick={() => inputNumber("3")}>
                3
              </Button>
              <Button variant="primary" onClick={performCalculation} className="row-span-2">
                =
              </Button>

              <Button variant="outline" onClick={() => inputNumber("0")} className="col-span-2">
                0
              </Button>
              <Button variant="outline" onClick={() => inputNumber(".")}>
                .
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
