//綁定 event
const btn_add = document.querySelector('.btn_add')
btn_add.addEventListener('click', function(e) {
  e.preventDefault();
  addData();
  switchTab();
  renderData();
  document.querySelector('input[type=text]').value = '';
});

const input = document.querySelector('input[type=text]');
input.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  btn_add.click();
});

const tab = document.querySelector('.tab');
tab.addEventListener('click', function(e) {
  const target = e.target;
  if (!target.classList.contains('tab-item')) return;
  const filter = target.dataset.filter;
  switchTab(target);
  renderData(filter);
});

const list = document.querySelector('.list');
list.addEventListener('click', function(e) {
  const target = e.target;

  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
    const todo = data.find(d => d.id == target.id);
    if (target.checked) {
      todo.status = TodoStatus.FINISHED;
    } else {
      todo.status = TodoStatus.INPROGRESS;
    }
    updateUnfinishedTodosCount();
  }
  if (target.classList.contains('delete')) {
    const listItem = target.closest('.list-item');
    const checkbox = listItem.querySelector('input[type=checkbox]');
    deleteData(checkbox.id);
    renderData();
  }
});

const clearFinishedBtn = document.getElementById('clearFinished');
clearFinishedBtn.addEventListener('click', function(e) {
  e.preventDefault();
  data = data.filter(todo => todo.status === TodoStatus.INPROGRESS);
  renderData();
});

const TodoStatus = {FINISHED: 'F', INPROGRESS: 'P'};
Object.freeze(TodoStatus);
let data = [
  {
    'id': 1,
    'status': 'P',
    'content': '把冰箱發霉的檸檬拿去丟'
  },
  {
    'id': 2,
    'status': 'F',
    'content': '打電話叫媽媽匯款給我'
  },
  {
    'id': 3,
    'status': 'P',
    'content': '整理電腦資料夾'
  },
  {
    'id': 4,
    'status': 'F',
    'content': '繳電費水費瓦斯費'
  },
  {
    'id': 5,
    'status': 'P',
    'content': '刪訊息'
  },
  {
    'id': 6,
    'status': 'P',
    'content': '約vicky禮拜三泡溫泉'
  },
  {
    'id': 7,
    'status': 'P',
    'content': '約ada禮拜四吃晚餐'
  }
];

function addData() {
  const text = input.value;
  if (!text) return;
  const timestamp = new Date().getTime();
  const todo = {
    id: timestamp,
    status: 'P',
    content: text
  };
  data.push(todo);
}

function deleteData(id) {
  const index = data.findIndex(d => d.id == id);
  if (index > -1) data.splice(index, 1);
}

/**
 * 
 * @param {HTMLElement} target tab item
 */
function switchTab(target) {
  const items = tab.querySelectorAll('.tab-item');
  if (!target) target = items[0];
  items.forEach(function(item) {
    if (item === target) item.classList.add('active');
    else item.classList.remove('active');
  });
}

function renderData(filter) {
  const list = document.querySelector('.list');
  list.innerHTML = '';
  data.forEach(function(todo) {
    if (filter && filter !== todo.status) return;
    const listItem = node('LI', '', 'list-item');
    listItem.innerHTML = `<label class='checklist' for='${todo.id}'>
      <input type='checkbox' id='${todo.id}' ${todo.status==='F'?'checked':''}/>
      <span class='checklist-text'>${todo.content}</span>
      </label>
      <a href='javascript:;' class='delete'></a>`;
    
    list.appendChild(listItem);
  });

  updateUnfinishedTodosCount();
}

function updateUnfinishedTodosCount() {
  let unfinishedTodosCount = data.filter(d => d.status === TodoStatus.INPROGRESS).length;
  document.getElementById('unfinishedTodosCount').textContent = unfinishedTodosCount;
}


//init
renderData();




//utils
function node(tagName, id, className) {
  const el = document.createElement(tagName);
  if (id) el.id = id;
  if (className) el.className = className;
  return el;
}
