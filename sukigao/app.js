const MEMBER_COUNT = 70;
const MAX_SELECTION = 4;

// 決勝で1人あたり最低何回くらい比較するか
const MIN_BATTLES_PER_PERSON = 5;

let currentGroups = [];
let currentGroupIndex = 0;
let selectedMembers = [];
let finalists = [];

let battleQueue = [];
let currentBattle = null;
let playedPairs = new Set();

let battleCount = 0;
let minimumBattleCount = 0;


// ============================
// 共通
// ============================

function shuffle(array) {

  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i--) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [copied[i], copied[j]] =
      [copied[j], copied[i]];
  }

  return copied;
}


function showScreen(screenId) {

  document
    .querySelectorAll(".screen")
    .forEach((screen) => {

      screen.classList.remove("active");

    });

  document
    .getElementById(screenId)
    .classList.add("active");

}


// ============================
// スタート
// ============================

document
  .getElementById("start-button")
  .addEventListener("click", startGame);


function startGame() {

  if (MEMBERS.length !== MEMBER_COUNT) {

    alert(
      `メンバー数が${MEMBER_COUNT}人ではありません。現在${MEMBERS.length}人です。`
    );

    return;
  }

  currentGroups = [];
  currentGroupIndex = 0;

  selectedMembers = [];
  finalists = [];

  battleQueue = [];
  currentBattle = null;

  playedPairs = new Set();

  battleCount = 0;
  minimumBattleCount = 0;


  MEMBERS.forEach((member) => {

    member.wins = 0;
    member.losses = 0;

  });


  const shuffledMembers =
    shuffle(MEMBERS);


  // 9人×7組 + 7人×1組
  for (
    let i = 0;
    i < shuffledMembers.length;
    i += 9
  ) {

    currentGroups.push(
      shuffledMembers.slice(i, i + 9)
    );

  }


  showScreen("qualifying-screen");

  showQualifyingGroup();
}


// ============================
// 予選
// ============================

function showQualifyingGroup() {

  const group =
    currentGroups[currentGroupIndex];


  document
    .getElementById("group-title")
    .textContent =
      `予選 ${currentGroupIndex + 1} / ${currentGroups.length}`;


  const grid =
    document.getElementById("member-grid");

  const nextButton =
    document.getElementById(
      "qualifying-next-button"
    );


  grid.innerHTML = "";

  selectedMembers = [];

  // 0人でも進める
  nextButton.disabled = false;


  group.forEach((member) => {

    const card =
      document.createElement("button");

    card.className =
      "qualifying-card";

    card.type = "button";


    card.innerHTML = `
      <img
        src="${member.image}"
        alt="${member.name}"
      >

      <div class="qualifying-info">

        <div class="qualifying-group">
          ${member.group}
        </div>

        <div class="qualifying-name">
          ${member.name}
        </div>

      </div>
    `;


    card.addEventListener(
      "click",
      () => {

        const alreadySelected =
          selectedMembers.includes(member);


        if (alreadySelected) {

          selectedMembers =
            selectedMembers.filter(
              (selected) =>
                selected !== member
            );

          card.classList.remove(
            "selected"
          );

          return;
        }


        if (
          selectedMembers.length >=
          MAX_SELECTION
        ) {

          alert(
            "選べるのは最大4人までです。"
          );

          return;
        }


        selectedMembers.push(member);

        card.classList.add(
          "selected"
        );

      }
    );


    grid.appendChild(card);

  });

}


// ============================
// 予選「決定」
// ============================

document
  .getElementById(
    "qualifying-next-button"
  )
  .addEventListener(
    "click",
    finishQualifyingGroup
  );


function finishQualifyingGroup() {

  finalists.push(
    ...selectedMembers
  );

  currentGroupIndex++;


  if (
    currentGroupIndex <
    currentGroups.length
  ) {

    showQualifyingGroup();

    return;
  }


  startFinal();
}


// ============================
// 決勝開始
// ============================

function startFinal() {

  if (finalists.length === 0) {

    alert(
      "誰も選ばれていません。最初からやり直します。"
    );

    location.reload();

    return;
  }


  if (finalists.length === 1) {

    finishGame();

    return;
  }


  finalists.forEach((member) => {

    member.wins = 0;
    member.losses = 0;

  });


  playedPairs = new Set();

  battleCount = 0;


  /*
    例：
    24人進出なら

    24 × 5 ÷ 2
    = 最低60試合
  */

  minimumBattleCount =
    Math.ceil(
      finalists.length *
      MIN_BATTLES_PER_PERSON /
      2
    );


  createBattleQueue();


  showScreen(
    "battle-screen"
  );


  nextBattle();
}


// ============================
// 対戦カード作成
// ============================

function createBattleQueue() {

  const pairs = [];


  for (
    let i = 0;
    i < finalists.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < finalists.length;
      j++
    ) {

      pairs.push([
        finalists[i],
        finalists[j]
      ]);

    }

  }


  battleQueue =
    shuffle(pairs);
}


// ============================
// 次の対戦
// ============================

function nextBattle() {

  while (
    battleQueue.length > 0
  ) {

    const pair =
      battleQueue.pop();


    const key =
      makePairKey(
        pair[0],
        pair[1]
      );


    if (
      !playedPairs.has(key)
    ) {

      playedPairs.add(key);


      // 左右の位置もランダム
      currentBattle =
        Math.random() < 0.5
          ? pair
          : [pair[1], pair[0]];


      showBattle(
        currentBattle
      );

      return;
    }

  }


  // 全組み合わせを消化したら
  // 対戦履歴をリセットして次周へ

  playedPairs =
    new Set();


  createBattleQueue();


  nextBattle();
}


function makePairKey(
  memberA,
  memberB
) {

  return [
    memberA.id,
    memberB.id
  ]
    .sort(
      (a, b) => a - b
    )
    .join("-");

}


// ============================
// 対戦表示
// ============================

function showBattle(pair) {

  const left =
    pair[0];

  const right =
    pair[1];


  document
    .getElementById(
      "left-image"
    )
    .src =
      left.image;


  document
    .getElementById(
      "left-image"
    )
    .alt =
      left.name;


  document
    .getElementById(
      "left-group"
    )
    .textContent =
      left.group;


  document
    .getElementById(
      "left-name"
    )
    .textContent =
      left.name;


  document
    .getElementById(
      "right-image"
    )
    .src =
      right.image;


  document
    .getElementById(
      "right-image"
    )
    .alt =
      right.name;


  document
    .getElementById(
      "right-group"
    )
    .textContent =
      right.group;


  document
    .getElementById(
      "right-name"
    )
    .textContent =
      right.name;

}


// ============================
// 勝敗記録
// ============================

function recordBattle(
  winner,
  loser
) {

  winner.wins++;

  loser.losses++;

  battleCount++;

  currentBattle = null;

  checkRanking();
}


// ============================
// 左を選択
// ============================

document
  .getElementById(
    "left-card"
  )
  .addEventListener(
    "click",
    () => {

      if (!currentBattle) {
        return;
      }

      recordBattle(
        currentBattle[0],
        currentBattle[1]
      );

    }
  );


// ============================
// 右を選択
// ============================

document
  .getElementById(
    "right-card"
  )
  .addEventListener(
    "click",
    () => {

      if (!currentBattle) {
        return;
      }

      recordBattle(
        currentBattle[1],
        currentBattle[0]
      );

    }
  );


// ============================
// ランキング
// ============================

function getRanking() {

  return [...finalists]
    .sort((a, b) => {

      if (
        b.wins !== a.wins
      ) {

        return (
          b.wins - a.wins
        );
      }


      if (
        a.losses !== b.losses
      ) {

        return (
          a.losses - b.losses
        );
      }


      return (
        a.id - b.id
      );

    });

}


// ============================
// 終了判定
// ============================

function checkRanking() {

  const ranking =
    getRanking();


  // 9人以下なら全員結果へ
  if (
    ranking.length <= 9
  ) {

    finishGame();

    return;
  }


  /*
    最低試合数に到達するまでは
    絶対に終了しない
  */

  if (
    battleCount <
    minimumBattleCount
  ) {

    nextBattle();

    return;
  }


  const ninth =
    ranking[8];

  const tenth =
    ranking[9];


  /*
    最低試合数を超えたあと、
    9位と10位に差があれば終了
  */

  if (
    ninth.wins >
    tenth.wins
  ) {

    finishGame();

    return;
  }


  nextBattle();
}


// ============================
// 結果
// ============================

function finishGame() {

  const ranking =
    getRanking();


  const top9 =
    ranking.slice(
      0,
      Math.min(
        9,
        ranking.length
      )
    );


  const rankingList =
    document.getElementById(
      "ranking-list"
    );


  rankingList.innerHTML = "";


  top9.forEach(
    (member, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "ranking-item";


      item.innerHTML = `

        <div class="rank-number">
          ${index + 1}
        </div>

        <img
          src="${member.image}"
          alt="${member.name}"
        >

        <div class="ranking-info">

          <div class="ranking-group">
            ${member.group}
          </div>

          <div class="ranking-name">
            ${member.name}
          </div>

        </div>

      `;


      rankingList.appendChild(
        item
      );

    }
  );


  showScreen(
    "result-screen"
  );
}


// ============================
// もう一度
// ============================

document
  .getElementById(
    "restart-button"
  )
  .addEventListener(
    "click",
    () => {

      location.reload();

    }
  );