"use client";

import {
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { useState } from "react";

const navigation = [
  {
    name: "Use Keywords",
    href: "#",
    icon: ChatBubbleLeftRightIcon,
  },
];

export default function Menu() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div>
      <button
        type="button"
        className="text-white -m-2.5 p-2.5 fixed top-8 left-8 z-40"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open Sidebar</span>
        <Bars3Icon className="h-10 w-10" aria-hidden="true" />
      </button>
      <div className="relative z-50">
        <div
          className={`fixed inset-0 flex transition transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className="fixed inset-0 bg-transparent"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative mr-16 flex flex-1 w-full max-w-xs">
            <div className="absolute left-full top-0 w-16 flex justify-center pt-5">
              <button
                type="button"
                className="text-white -m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-8 w-8" aria-hidden="true" />
              </button>
            </div>
            <div className="bg-white flex grow flex-col gap-y-5 overflow-y-auto bg-opacity-20 backdrop-blur-lg shadow-lg px-6">
              <nav className="flex flex-1 flex-col">
                <ul
                  role="list"
                  className="flex flex-1 flex-col -mx-2 space-y-1 py-4"
                >
                  {navigation.map((item) => {
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          as={item.href}
                          className="text-white hover:bg-gradient-to-r hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 flex gap-x-3 font-semibold rounded-md p-2 text-sm leading-6"
                        >
                          <item.icon
                            className="h-6 w-6 shrink-0"
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
