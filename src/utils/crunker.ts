"use client";

import Crunker from "crunker";

const crunker = typeof window !== "undefined" ? new Crunker() : null;

export default crunker;
