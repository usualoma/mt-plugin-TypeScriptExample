// @ts-ignore
import { render, fireEvent } from "@testing-library/svelte/svelte5";
import Editor from "./Editor.svelte";

describe("Editor", () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  const setup = (initialValue = "") => {
    return render(Editor, {
      props: {
        value: initialValue,
        onChange: mockOnChange,
      },
    });
  };

  it("初期状態で追加ボタンが表示される", () => {
    const { getByText } = setup();
    expect(getByText("+メンバーを追加")).toBeTruthy();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("メンバーを追加できる", async () => {
    const { getByText, getAllByPlaceholderText } = setup();

    expect(() => getAllByPlaceholderText("役割")).toThrow();
    expect(() => getAllByPlaceholderText("名前")).toThrow();

    await fireEvent.click(getByText("+メンバーを追加"));

    expect(getAllByPlaceholderText("役割").length).toBe(1);
    expect(getAllByPlaceholderText("名前").length).toBe(1);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("メンバー情報を入力できる", async () => {
    const { getByText, getAllByPlaceholderText } = setup();

    await fireEvent.click(getByText("+メンバーを追加"));

    const roleInput = getAllByPlaceholderText("役割")[0];
    const nameInput = getAllByPlaceholderText("名前")[0];

    await fireEvent.input(roleInput, { target: { value: "部長" } });
    await fireEvent.input(nameInput, { target: { value: "山田太郎" } });

    expect(mockOnChange).toHaveBeenCalledWith(
      "<table><tr><td>部長</td><td>山田太郎</td></tr></table>"
    );
  });

  it("メンバーを削除できる", async () => {
    const { getAllByText } = setup(
      "<table><tr><td>部長</td><td>山田太郎</td></tr></table>"
    );

    await fireEvent.click(getAllByText("削除")[0]);

    expect(mockOnChange).toHaveBeenCalledWith("<table></table>");
  });

  it("複数のメンバーを追加できる", async () => {
    const { getByText, getAllByPlaceholderText } = setup();

    // メンバーを2回追加
    await fireEvent.click(getByText("+メンバーを追加"));
    await fireEvent.click(getByText("+メンバーを追加"));

    expect(getAllByPlaceholderText("役割").length).toBe(2);
    expect(getAllByPlaceholderText("名前").length).toBe(2);

    await fireEvent.input(getAllByPlaceholderText("役割")[0], {
      target: { value: "部長" },
    });
    await fireEvent.input(getAllByPlaceholderText("名前")[0], {
      target: { value: "山田太郎" },
    });
    await fireEvent.input(getAllByPlaceholderText("役割")[1], {
      target: { value: "課長" },
    });
    await fireEvent.input(getAllByPlaceholderText("名前")[1], {
      target: { value: "佐藤花子" },
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      "<table><tr><td>部長</td><td>山田太郎</td></tr><tr><td>課長</td><td>佐藤花子</td></tr></table>"
    );
  });

  it("不正なHTMLでも初期化できる", () => {
    const { getByText } = setup("不正なHTML");

    expect(getByText("+メンバーを追加")).toBeTruthy();
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
