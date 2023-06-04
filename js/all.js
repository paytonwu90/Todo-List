const Prompt = (function() {
  let available = false;
  try {
    if (bootstrap && $('#promptModal') && $('#promptModal-text')) available = true;
  } catch(ignored) {}
  if (!available) return {};

  const modal = new bootstrap.Modal($('#promptModal'));
  const modalContent = $('#promptModal-text');

  const publicAPIs = {
    content: function(content) {
      if (typeof content === 'string') {
        modalContent.textContent = content;
      } else if (content instanceof HTMLElement) {
        modalContent.appendChild(content);
      }
      return this;
    },
    show: function() {
      modal.show();
    }
  }

  return publicAPIs;
})();

const FormValidator = (function() {
  'use strict';

  const constraints = {
    "email": {  
      presence:  {
        message: "^此欄位不可為空"
      }, // Email 是必填欄位
      email: {
        message: "^不符合 Email 格式"
      } // 需要符合 email 格式
    },
    "username": {  
      presence:  {
        message: "^此欄位不可為空"
      }
    },
    "password": {
      presence: {
        message: "^此欄位不可為空"
      }, // 密碼是必填欄位
      length: {
        minimum: 5, // 長度大於 5
        maximum: 12, // 長度小於 12
        message: "^密碼長度需大於 5 小於 12"
      },
    },
    "passwordConfirm": {  
      presence: {
        message: "^此欄位不可為空"
      },// 確認密碼是必填欄位
      equality: {
        attribute: "password",// 此欄位要和密碼欄位一樣
        message: "^密碼不相同"
      }
    },
  };

  const publicAPIs = {
    /**
     * @param {HTMLElement} form 
     * @returns {Object}
     */
    validateForm: function(form) {
      const inputs = $$('input', form);
      const errors = validate(form, constraints) || {};
      const collectedErrors = {};
      const t = this;
      //之所以還要另外 collect errors 的原因是，對 validate.js 來說，
      //只要在 `constraints` 裡面有定義 name 的驗證條件但沒有符合的話就會回傳 error。
      //在註冊表單和登入表單共用同一個 constraints 的情況下，登入表單會收到不屬於它的 error (它沒有這些欄位)
      inputs.forEach(function(input) {
        const inputName = input.name;
        if (!inputName) return;
        const errorForInput = errors[inputName] || [];
        t.showErrorsForInput(input, errorForInput);
        if (errorForInput.length > 0) {
          collectedErrors[inputName] = errorForInput;
        }
      });
      //this.showErrors(form, errors);
      return collectedErrors;
    },

    /**
     * 
     * @param {HTMLElement} input 
     * @param {HTMLElement} form 
     * @returns {Array}
     */
    validateInput: function(input, form) {
      if (!input.name) return [];
      const errors = validate(form, constraints) || {};
      const errorForInput = errors[input.name] || [];
      this.showErrorsForInput(input, errorForInput);
      return errorForInput;
    },

    showErrors: function(form, errors) {
      for (const [inputName, errorArr] of Object.entries(errors)) {
        const input = $(`input[name=${inputName}]`, form);
        this.showErrorsForInput(input, errorArr);
      }
    },

    showErrorsForInput: function(input, errors) {
      if (!input) return;
      const messageEl = findMessageElement(input);
      let msg = '';
      errors.forEach(txt => msg += (msg.length > 0 ? '<br>' : '') + txt);
      messageEl.innerHTML = msg;
    }
  };

  /**
   * find correspoding `message` element of specific input
   * @param {HTMLElement} el input element
   * @returns {HTMLElement} message element
   */
  function findMessageElement(el) {
    if (!el) return;
    const inputSection = el.closest('.inputSection');
    return $('.message', inputSection);
  }


  return publicAPIs;
})();

const RegisterHelper = (function() {
  const publicAPIs = {
    register: function(form) {
      const email = $('input[name=email]', form).value;
      const username = $('input[name=username]', form).value;
      const password = $('input[name=password]', form).value;
      const storageKey = CryptoJS.SHA1(email+'_'+password).toString();

      if (!email || !username || !password) {
        Prompt.content('請填寫完整的註冊資訊').show();
        return;
      }
      //email+password 可以用來判斷是否成功登入
      if (checkEmailExist(email)) {
        Prompt.content('這個 email 已被註冊過').show();
        return false;
      } else {
        localStorage.setItem(email, username); //用來判斷這個 email 有沒有被註冊過
        localStorage.setItem(storageKey, username); //用來判斷帳號密碼是否符合
        localStorage.setItem('TODOLIST_login', email); //用來判斷現在登入的 email
        Prompt.content('註冊成功').show();
        setTimeout(() => {
          RedirectHelper.goHomePage();
        }, 2000);
      }
    }
  };

  function checkEmailExist(email) {
    return localStorage.getItem(email) !== null;
  }

  return publicAPIs;
})();

const LoginHelper = (function() {
  const publicAPIs = {
    login: function(form) {
      const email = $('input[name=email]', form).value;
      const password = $('input[name=password]', form).value;
      const storageKey = CryptoJS.SHA1(email+'_'+password).toString();
      const username = getUsername(storageKey);
      if (username == null) {
        Prompt.content('Email 或密碼不正確').show();
        return false;
      } else {
        Prompt.content(`Hi ${username}，歡迎回來！`).show();
        localStorage.setItem('TODOLIST_login', email);
        setTimeout(() => {
          RedirectHelper.goHomePage();
        }, 2000);
        
        return true;
      }
    },
    getLoginUser: function() {
      return localStorage.getItem('TODOLIST_login'); //email
    },
  };

  function getUsername(storageKey) {
    return localStorage.getItem(storageKey);
  }

  return publicAPIs;
})();

const Logout = function() {
  if (LoginHelper.getLoginUser()) {
    localStorage.removeItem('TODOLIST_login');
  }
  RedirectHelper.goLoginPage();
};

const RedirectHelper = (function() {
  const pathname = window.location.pathname;
  let hrefPrefix = '';

  init();
  function init() {
    //找到 pathname 的最後一個 '/'，從這裡開始替換 url
    //要處理這個的原因是推上 github 之後各頁面的 pathname 不會是 /*.html 而是 /<repo>/*.html
    const index = pathname.lastIndexOf('/');
    hrefPrefix = pathname.substring(0, index);
  }

  const publicAPIs = {
    isHomePage: function() {
      return pathname === hrefPrefix + '/' || pathname === hrefPrefix + '/index.html';
    },
    isLoginPage: function() {
      return pathname === hrefPrefix + '/login.html';
    },
    isRegisterPage: function() {
      return pathname === hrefPrefix + '/register.html';
    },
    goHomePage: function() {
      window.location.href = hrefPrefix + '/';
    },
    goLoginPage: function() {
      window.location.href = hrefPrefix + '/login.html';
    }
  }
  return publicAPIs;
})();



//Redirect
//沒登入不能進到首頁，有登入的話一定導到首頁
(function() {
  const user = LoginHelper.getLoginUser();
  if (user) {
    if (RedirectHelper.isLoginPage() || RedirectHelper.isRegisterPage()) {
      RedirectHelper.goHomePage();
    }
  }
  else {
    if (RedirectHelper.isHomePage()) {
      RedirectHelper.goLoginPage();
    }
  }
})();


//log in and register page init
const form = $('form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const t = this;
    //validate form
    const errors = FormValidator.validateForm(t);

    //表單驗證通過之後就可以進行註冊驗證或登入驗證了
    if (Object.keys(errors).length === 0) {
      if (t.id === 'registerForm') {
        RegisterHelper.register(t);
      }
      else if (t.id === 'loginForm') {
        LoginHelper.login(t);
      }
    }
  });
  form.addEventListener('change', function(e) {
    if (e.target.tagName !== 'INPUT') return;
    const input = e.target;
    //validate specific input element value
    FormValidator.validateInput(input, form);
  });
  form.addEventListener('click', function(e) {
    const target = e.target;
    if (target.classList.contains('togglePassword')) {
      const toggleButton = target;
      const passwordInput = toggleButton.closest('.inputSection').querySelector('input[role=password]');
      if (passwordInput.getAttribute('type') === 'password') {
        passwordInput.setAttribute('type', 'text');
        toggleButton.querySelector('i').classList.add('fa-eye');
        toggleButton.querySelector('i').classList.remove('fa-eye-slash');
      } else {
        passwordInput.setAttribute('type', 'password');
        toggleButton.querySelector('i').classList.remove('fa-eye');
        toggleButton.querySelector('i').classList.add('fa-eye-slash');
      }
    }
  });
}



let data = [];

const TodoStatus = {FINISHED: 'F', INPROGRESS: 'P'};
Object.freeze(TodoStatus);

//index init
const indexInit = (function() {
  const logout = $('#logout');
  if (logout) {
    logout.addEventListener('click', Logout);
  }

  const usernameEl = $('#username');
  const loginEmail = LoginHelper.getLoginUser();
  const loginUsername = localStorage.getItem(loginEmail) || 'guest';
  if (usernameEl) usernameEl.textContent = loginUsername;

  const btn_add = $('.btn-add');
  if (!btn_add) return;
  btn_add.addEventListener('click', function(e) {
    e.preventDefault();
    addData();
    switchTab();
    renderData();
    $('input[type=text]').value = '';
  });

  const input = $('#todo-input');
  input.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    btn_add.click();
  });

  const tab = $('.tab');
  tab.addEventListener('click', function(e) {
    const target = e.target;
    if (!target.classList.contains('tab-item')) return;
    const filter = target.dataset.filter;
    switchTab(target);
    renderData(filter);
  });

  const list = $('.checklist');
  list.addEventListener('click', function(e) {
    const target = e.target;

    if (target.matches('input[type=checkbox]')) {
      const todo = data.find(d => d.id == target.id);
      if (target.checked) {
        todo.status = TodoStatus.FINISHED;
      } else {
        todo.status = TodoStatus.INPROGRESS;
      }
      updateUnfinishedTodosCount();
    }
    if (target.classList.contains('checklist-item__delete')) {
      const listItem = target.closest('.checklist-item');
      const checkbox = $('input[type=checkbox]', listItem);
      deleteData(checkbox.id);
      renderData();
    }
  });

  const clearFinishedBtn = $('#clearFinished');
  clearFinishedBtn.addEventListener('click', function(e) {
    e.preventDefault();
    data = data.filter(todo => todo.status === TodoStatus.INPROGRESS);
    renderData();
  });

  data = [
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

  //init
  renderData();
})();


function addData() {
  const input = $('#todo-input');
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
  const tab = $('.tab');
  const items = $$('.tab-item', tab);
  if (!target) target = items[0];
  items.forEach(function(item) {
    if (item === target) item.classList.add('active');
    else item.classList.remove('active');
  });
}

function renderData(filter) {
  const list = $('.checklist');
  list.innerHTML = '';
  data.forEach(function(todo) {
    if (filter && filter !== todo.status) return;
    const listItem = node('LI', '', 'checklist-item');
    listItem.innerHTML = `<label class='checklist-item__body' for='${todo.id}'>
      <input type='checkbox' id='${todo.id}' ${todo.status==='F'?'checked':''}/>
      <span class='checklist-item__text'>${todo.content}</span>
      </label>
      <a href='javascript:;' class='checklist-item__delete'></a>`;
    
    list.appendChild(listItem);
  });

  updateUnfinishedTodosCount();

  const todoBoard = $('#todo-board');
  const todoEmpty = $('#todo-empty');
  if (data.length > 0) {
    todoBoard.classList.remove('d-none');
    todoEmpty.classList.add('d-none');
  } else {
    todoBoard.classList.add('d-none');
    todoEmpty.classList.remove('d-none');
  }
}

function updateUnfinishedTodosCount() {
  let unfinishedTodosCount = data.filter(d => d.status === TodoStatus.INPROGRESS).length;
  $('#unfinishedTodosCount').textContent = unfinishedTodosCount;
}






//utils
function node(tagName, id, className) {
  const el = document.createElement(tagName);
  if (id) el.id = id;
  if (className) el.className = className;
  return el;
}

function $(selector, element = document) {
  return element.querySelector(selector);
}
function $$(selector, element = document) {
  return element.querySelectorAll(selector);
}
