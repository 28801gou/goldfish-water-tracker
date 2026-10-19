import { ApiService } from "./services/ApiService.js";

document.addEventListener("DOMContentLoaded", async () => {
  const addTankForm = document.getElementById("addTankForm");
  if (addTankForm) {
    addTankForm.addEventListener("submit", handleAddTank);
  }

  // 画面ロード時に一覧を表示
  await loadTanks();
});

// ▼ 登録処理
async function handleAddTank(event) {
  event.preventDefault();
  const nameInput = document.getElementById("newTankName");
  const locationInput = document.getElementById("newTankLocation");
  const resultMsg = document.getElementById("addTankResult");

  try {
    const newTank = await ApiService.postTank(
      nameInput.value,
      locationInput.value,
    );
    resultMsg.style.display = "block";
    resultMsg.textContent = `✅ 水槽「${newTank.name}」を登録しました！（ID: ${newTank.id}）`;
    nameInput.value = "";

    setTimeout(() => {
      resultMsg.style.display = "none";
    }, 5000);
    await loadTanks(); // テーブルを最新化
  } catch (error) {
    alert("エラー: " + error.message);
  }
}

// ▼ 一覧表示処理
async function loadTanks() {
  const tbody = document.getElementById("tankTableBody");
  if (!tbody) return;

  try {
    const tanks = await ApiService.getTanks();
    tbody.innerHTML = "";

    tanks.forEach((tank) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${tank.id}</td>
        <td>${tank.name}</td>
        <td>${tank.location === "INDOOR" ? "屋内" : "屋外"}</td>
        <td>
          <button class="btn-secondary edit-btn" data-id="${tank.id}" data-name="${tank.name}" data-location="${tank.location}" style="padding: 4px 8px; font-size: 0.9rem;">編集</button>
          <button class="delete-btn" data-id="${tank.id}" style="padding: 4px 8px; font-size: 0.9rem; background-color: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer;">削除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // ボタンにイベントを紐付け
    document
      .querySelectorAll(".edit-btn")
      .forEach((btn) => btn.addEventListener("click", handleEditTank));
    document
      .querySelectorAll(".delete-btn")
      .forEach((btn) => btn.addEventListener("click", handleDeleteTank));
  } catch (error) {
    console.error("一覧の取得エラー:", error);
  }
}

// ▼ 編集（Update）処理
async function handleEditTank(event) {
  const id = event.target.dataset.id;
  const oldName = event.target.dataset.name;
  const oldLocation = event.target.dataset.location;

  const newName = prompt("新しい水槽名を入力してください", oldName);
  if (newName === null || newName.trim() === "") return;

  let newLocation = prompt(
    "設置場所を INDOOR または OUTDOOR で入力してください",
    oldLocation,
  );
  if (newLocation === null) return;
  newLocation = newLocation.toUpperCase();
  if (newLocation !== "INDOOR" && newLocation !== "OUTDOOR") {
    alert("INDOOR か OUTDOOR のどちらかを入力してください");
    return;
  }

  try {
    await ApiService.putTank(id, newName.trim(), newLocation);
    alert("更新しました！");
    await loadTanks(); // 最新の一覧を再描画
  } catch (error) {
    alert("更新に失敗しました: " + error.message);
  }
}

// ▼ 削除（Delete）処理
async function handleDeleteTank(event) {
  const id = event.target.dataset.id;
  if (
    !confirm(
      `本当に ID:${id} の水槽を削除しますか？\n※関連する測定ログが残っているとエラーになる場合があります`,
    )
  ) {
    return;
  }

  try {
    await ApiService.deleteTank(id);
    alert("削除しました。");
    await loadTanks(); // 最新の一覧を再描画
  } catch (error) {
    alert("削除に失敗しました: " + error.message);
  }
}
