<script module lang="ts">
  declare const window: Window & {
    CMSScriptURI: string;
  };
</script>

<script lang="ts">
  import { hc } from "hono/client";
  import type { AppType } from "../../app/src/index";
  import { onMount } from "svelte";

  let {
    screenId,
  }: {
    screenId: string;
  } = $props();

  let cachedToken = $state<string | null>(null);
  let tokenExpiry = $state<number | null>(null);

  const getUserToken = async (): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);

    if (cachedToken && tokenExpiry && now < tokenExpiry - 30) {
      return cachedToken;
    }

    const url = new URL(window.CMSScriptURI, window.location.href);
    url.searchParams.set("__mode", "mt_plugin_sticky-note_user_token");
    const res = await fetch(url);
    const jwt = (await res.json()).result;

    // JWTをデコードして有効期限を取得
    const [, payload] = jwt.split(".");
    const decodedPayload = JSON.parse(atob(payload));

    cachedToken = jwt;
    tokenExpiry = decodedPayload.exp;

    return jwt;
  };

  const getClient = async () =>
    hc<AppType>(API_URL, {
      headers: {
        Authorization: `Bearer ${await getUserToken()}`,
      },
    });

  let messages = $state<
    Array<{ id: number; content: string; user_id: string }>
  >([]);
  let newMessage = $state("");

  const getMessages = async () => {
    const res = await (
      await (await getClient())[":screenId"].$get({ param: { screenId } })
    ).json();
    if ("err" in res) {
      throw new Error(res.err);
    }
    messages = res;
  };

  const addMessage = async (content: string) => {
    const res = await (
      await (
        await getClient()
      )[":screenId"].$post({
        param: { screenId },
        json: {
          content,
        },
      })
    ).json();
    if ("err" in res) {
      throw new Error(res.err);
    }
    await getMessages(); // 付箋一覧を更新
    newMessage = ""; // 入力欄をクリア
  };

  const deleteMessage = async (id: number) => {
    const res = await (
      await (
        await getClient()
      )[":screenId"][":noteId"].$delete({
        param: { screenId, noteId: String(id) },
      })
    ).json();
    if ("err" in res) {
      throw new Error(res.err);
    }
    await getMessages(); // 付箋一覧を更新
  };

  const handleSubmit = () => {
    if (newMessage.trim()) {
      addMessage(newMessage);
    }
  };

  onMount(() => {
    getMessages();
  });
</script>

<div class="sticky-notes">
  <div class="notes-list">
    {#each messages as message}
      <div class="note">
        <button
          class="delete-btn"
          type="button"
          onclick={() => deleteMessage(message.id)}>×</button
        >
        <p class="content">{message.content}</p>
        <p class="author">@{message.user_id}</p>
      </div>
    {/each}
  </div>

  <div class="input-area">
    <input
      type="text"
      bind:value={newMessage}
      placeholder="付箋の内容を入力..."
    />
    <button class="btn-primary" type="button" onclick={handleSubmit}
      >追加</button
    >
  </div>
</div>

<style>
  .sticky-notes {
    margin-bottom: 1rem;
  }

  .notes-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .note {
    background: #ffd75e;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .note .content {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .note .author {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
    text-align: right;
  }

  .input-area {
    display: flex;
    gap: 0.5rem;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    background-color: #0d6efd;
    border: 1px solid #0a58ca;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.15s ease-in-out;
  }

  .btn-primary:hover {
    background-color: #0b5ed7;
  }

  .btn-primary:active {
    background-color: #0a58ca;
  }

  .delete-btn {
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.5);
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    padding: 0;
    transition: all 0.2s ease;
  }

  .delete-btn:hover {
    background: rgba(255, 0, 0, 0.2);
    color: #ff0000;
  }
</style>
