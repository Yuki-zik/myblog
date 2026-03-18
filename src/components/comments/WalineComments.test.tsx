import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WalineComments from "./WalineComments";

const { destroy, init } = vi.hoisted(() => {
  const destroyMock = vi.fn();
  const initMock = vi.fn(() => ({ destroy: destroyMock }));

  return {
    destroy: destroyMock,
    init: initMock,
  };
});

vi.mock("@waline/client", () => ({
  init,
}));

describe("WalineComments", () => {
  afterEach(() => {
    destroy.mockReset();
    init.mockClear();
    vi.unstubAllEnvs();
  });

  it("renders a configuration hint when server url is missing", () => {
    vi.stubEnv("PUBLIC_WALINE_SERVER_URL", "");

    render(<WalineComments path="/posts/test-post" />);

    expect(
      screen.getByText(/PUBLIC_WALINE_SERVER_URL/),
    ).toBeInTheDocument();
    expect(init).not.toHaveBeenCalled();
  });

  it("initializes waline with the current post path and destroys it on unmount", () => {
    vi.stubEnv("PUBLIC_WALINE_SERVER_URL", "https://waline.example");

    const { unmount } = render(<WalineComments path="/posts/test-post" />);

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        serverURL: "https://waline.example",
        path: "/posts/test-post",
        lang: "zh-CN",
        login: "disable",
        dark: 'html[data-theme="dark"]',
      }),
    );

    unmount();

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("re-initializes cleanly when the post path changes", () => {
    vi.stubEnv("PUBLIC_WALINE_SERVER_URL", "https://waline.example");

    const { rerender, unmount } = render(<WalineComments path="/posts/first-post" />);

    rerender(<WalineComments path="/posts/second-post" />);

    expect(init).toHaveBeenCalledTimes(2);
    expect(init).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: "/posts/second-post",
      }),
    );
    expect(destroy).toHaveBeenCalledTimes(1);

    unmount();

    expect(destroy).toHaveBeenCalledTimes(2);
  });
});
