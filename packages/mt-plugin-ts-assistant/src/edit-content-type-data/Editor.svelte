<script lang="ts">
  const apiKey = OPEN_AI_API_KEY;
  const assistantId = OPEN_AI_ASSISTANT_ID;

  let threadId: string | undefined = undefined;
  let messages = $state<
    {
      role: "user" | "assistant";
      content: string;
      imageData?: string;
    }[]
  >([]);
  let userInput = $state("");
  let isLoading = $state(false);

  let {
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  } = $props();

  let messagesContainer: HTMLDivElement;

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async function getThreadId(): Promise<string> {
    if (threadId) {
      return threadId;
    }

    const response = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });

    const data = await response.json();
    threadId = data.id;
    return threadId as string;
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "assistants");

    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data.id;
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function sendMessage(content: string, imageFile?: File) {
    const currentThreadId = await getThreadId();

    let imageData: string | undefined;
    if (imageFile) {
      imageData = await fileToBase64(imageFile);
    }

    // ユーザーのメッセージを末尾に追加
    messages = [
      ...messages,
      {
        role: "user",
        content: content,
        imageData,
      },
    ];

    // スクロールを即時実行
    setTimeout(scrollToBottom, 0);

    isLoading = true;
    let messageContent: any[] = [];

    if (imageFile) {
      const fileId = await uploadImage(imageFile);
      messageContent.push({
        type: "image_file",
        image_file: {
          file_id: fileId,
        },
      });
    }

    if (content) {
      messageContent.push({
        type: "text",
        text: content,
      });
    }

    // メッセージを送信
    await fetch(
      `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          role: "user",
          content: messageContent,
        }),
      }
    );

    // アシスタントを実行
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${currentThreadId}/runs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      }
    );

    const runData = await runResponse.json();

    // 実行完了を待つ
    await waitForCompletion(currentThreadId, runData.id);

    // メッセージを取得して最新の応答のみを追加
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const messagesData = await messagesResponse.json();
    const latestMessage = messagesData.data[0];

    // 最新のアシスタントの応答も末尾に追加
    if (latestMessage.role === "assistant") {
      messages = [
        ...messages,
        {
          role: latestMessage.role,
          content: latestMessage.content
            .map((content: any) => {
              if (content.type === "text") {
                return content.text.value;
              }
              return "";
            })
            .join("\n"),
        },
      ];
    }

    isLoading = false;

    // 応答追加後にもう一度スクロール
    setTimeout(scrollToBottom, 0);
  }

  async function waitForCompletion(threadId: string, runId: string) {
    while (true) {
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      const data = await response.json();
      if (data.status === "completed") {
        break;
      } else if (data.status === "failed") {
        throw new Error("Assistant run failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  let imageInput: HTMLInputElement;
  let selectedImage: File | null = null;

  function handleImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedImage = input.files[0];
    }
  }

  async function handleSubmit() {
    if (!userInput.trim() && !selectedImage) return;
    const input = userInput;
    const image = selectedImage;
    userInput = "";
    selectedImage = null;
    if (imageInput) {
      imageInput.value = "";
    }

    // 最初のメッセージの場合、AIへの具体的な指示を含める
    if (messages.length === 0 && value) {
      await sendMessage(
        `現在選択中のコンテンツは以下の通りで、これを置き換えます。。「-------------------------------」で区切られた部分がコンテンツです。

-------------------------------
${value}
-------------------------------

このコンテンツを、以下の指示に従って変更してください。

${input}
`,
        image || undefined
      );
    } else {
      await sendMessage(input, image || undefined);
    }
  }

  function extractContent(message: string): string | null {
    const match = message.match(/```\n([\s\S]*?)\n```/);
    return match ? match[1] : null;
  }

  function useGeneratedContent(content: string) {
    const extractedContent = extractContent(content);
    if (extractedContent) {
      onChange(extractedContent);
    }
  }

  // フォーカスアクションを定義
  function autofocus(node: HTMLTextAreaElement) {
    node.focus();
  }
</script>

<div class="chat-container">
  <div class="messages" bind:this={messagesContainer}>
    {#each messages as message}
      <div class="message {message.role}">
        <p>{message.content}</p>
        {#if message.imageData}
          <img
            src={message.imageData}
            alt="Uploaded image"
            class="message-image"
          />
        {/if}
        {#if message.role === "assistant" && extractContent(message.content)}
          <button
            type="button"
            onclick={() => useGeneratedContent(message.content)}
          >
            この内容を使用
          </button>
        {/if}
      </div>
    {/each}
    {#if isLoading}
      <div class="loading">処理中...</div>
    {/if}
  </div>

  <div class="input-area">
    <div class="input-controls">
      <textarea
        use:autofocus
        bind:value={userInput}
        onkeydown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="メッセージを入力..."
      ></textarea>
      <div class="image-upload">
        <input
          type="file"
          accept="image/*"
          bind:this={imageInput}
          onchange={handleImageSelect}
          id="image-input"
        />
        <label for="image-input" class="image-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
            />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </label>
        {#if selectedImage}
          <span class="image-name">{selectedImage.name}</span>
        {/if}
      </div>
    </div>
    <button type="button" onclick={handleSubmit} disabled={isLoading}
      >送信</button
    >
  </div>
</div>

<style>
  .chat-container {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    height: 300px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .messages {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .message {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .message.user {
    background-color: #e3f2fd;
    margin-left: 2rem;
  }

  .message.assistant {
    background-color: #f5f5f5;
    margin-right: 2rem;
  }

  .input-area {
    display: flex;
    padding: 1rem;
    border-top: 1px solid #ccc;
  }

  textarea {
    flex-grow: 1;
    margin-right: 0;
    padding: 0.5rem;
    min-height: 40px;
    resize: vertical;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #ccc;
  }

  .loading {
    text-align: center;
    color: #666;
  }

  .reference-content {
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #ccc;
  }

  .reference-content pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    font-size: 0.9em;
  }

  .input-controls {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    margin-right: 1rem;
  }

  .image-upload {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
  }

  .image-upload input[type="file"] {
    display: none;
  }

  .image-button {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    background-color: #f0f0f0;
    border-radius: 4px;
    margin-right: 0.5rem;
  }

  .image-name {
    font-size: 0.8em;
    color: #666;
  }

  textarea {
    margin-right: 0;
  }

  .message-image {
    max-width: 200px;
    width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 0.5rem 0;
    display: block;
  }
</style>
