"use client";
import { Provider } from "jotai";

export default function StoreFrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <div className="">{children}</div>
    </Provider>
  );
}
