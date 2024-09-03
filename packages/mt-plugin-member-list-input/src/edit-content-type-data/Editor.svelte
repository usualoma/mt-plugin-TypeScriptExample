<script lang="ts">
  import { read, utils } from "xlsx";

  interface Member {
    role: string;
    name: string;
  }
  let {
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  } = $props();

  let members: Member[] = $state([]);

  const parser = new DOMParser();
  try {
    members = [...parser.parseFromString(value, "text/html").body.querySelectorAll("tr")].map(
      (tr) => ({
        role: tr.children[0].textContent,
        name: tr.children[1].textContent,
      })
    ) as Member[];
  } catch {
    members = [];
  }

  function updateMembers() {
    onChange(
      `<table>${members
        .map(
          (member) => `<tr><td>${member.role}</td><td>${member.name}</td></tr>`
        )
        .join("")}</table>`
    );
  }

  function addMember() {
    members = [...members, { role: "", name: "" }];
  }

  function removeMember(index: number) {
    members = members.filter((_, i) => i !== index);
    updateMembers();
  }

  async function handleExcelUpdate() {
    // ファイル選択用の input 要素を作成
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // ファイルを ArrayBuffer として読み込む
        const buffer = await file.arrayBuffer();
        // XLSXワークブックを解析
        const workbook = read(buffer);
        // 最初のシートを取得
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // シートのデータを配列に変換
        const data = utils.sheet_to_json<string[]>(firstSheet, { header: 1 });

        // データを Member 形式に変換（最初の2列を使用）
        const newMembers = data
          .filter(row => row.length >= 2) // 少なくとも2列あるデータのみ
          .map(row => ({
            role: String(row[0] || ''),
            name: String(row[1] || '')
          }));

        // 既存のメンバーリストを更新
        members = newMembers;
        updateMembers();
      } catch (error) {
        console.error('Excelファイルの読み込みに失敗しました:', error);
        alert('Excelファイルの読み込みに失敗しました。');
      }
    };

    // ファイル選択ダイアログを表示
    input.click();
  }
</script>

<div class="members">
  {#each members as member, i}
    <div class="member">
      <input
        type="text"
        bind:value={member.role}
        placeholder="役割"
        oninput={updateMembers}
        required
      />
      <input
        type="text"
        bind:value={member.name}
        placeholder="名前"
        oninput={updateMembers}
        required
      />
      <button 
        type="button" 
        class="delete-link" 
        onclick={() => removeMember(i)}
      >
        削除
      </button>
    </div>
  {/each}
  <div class="button-group">
    <button 
      type="button" 
      class="member-list-add-button" 
      onclick={addMember}
    >
      +メンバーを追加
    </button>
    <button
      type="button"
      class="excel-update-link"
      onclick={handleExcelUpdate}
    >
      エクセルから更新
    </button>
  </div>
</div>

<style>
  .members {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .member {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  input {
    width: 200px;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    background-color: #fff;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  input:focus {
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  button {
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    border-radius: 0.25rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .delete-link {
    padding: 0;
    border: none;
    background: none;
    color: #dc7581;
    font-size: 0.875rem;
    text-decoration: underline;
    cursor: pointer;
    height: 38px;
    display: flex;
    align-items: center;
  }

  .delete-link:hover {
    color: #c45561;
  }

  .member-list-add-button {
    width: 200px;
    color: #212529;
    background-color: #fff;
    border: 1px solid #dee2e6;
  }

  .member-list-add-button:hover {
    background-color: #f8f9fa;
    border-color: #dee2e6;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .excel-update-link {
    padding: 0;
    border: none;
    background: none;
    color: #0d6efd;
    font-size: 0.875rem;
    text-decoration: underline;
    cursor: pointer;
  }

  .excel-update-link:hover {
    color: #0a58ca;
  }
</style>
