(function () {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const MSG_MIN = 10;
  const MSG_MAX = 500;

  const fields = {
    name:    form.querySelector('[name="name"]'),
    email:   form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]'),
  };

  function setup() {
    form.querySelectorAll('.field').forEach((label, i) => {
      const input = label.querySelector('.field__input');
      const errId = `field-err-${i}`;
      const err   = document.createElement('span');
      err.className = 'field__error';
      err.id        = errId;
      err.setAttribute('aria-live', 'polite');
      label.insertAdjacentElement('afterend', err);
      input.setAttribute('aria-describedby', errId);
    });

    const counter = document.createElement('span');
    counter.className = 'field__counter';
    counter.setAttribute('aria-live', 'polite');
    counter.textContent = `0 / ${MSG_MAX}`;
    fields.message.closest('.field').appendChild(counter);

    fields.message.addEventListener('input', () => {
      const len = fields.message.value.length;
      counter.textContent = `${len} / ${MSG_MAX}`;
      counter.classList.toggle('field__counter--over', len > MSG_MAX);
    });

    fields.name.addEventListener('blur', validateName);
    fields.email.addEventListener('blur', validateEmail);
    fields.message.addEventListener('blur', validateMessage);
  }

  function setError(input, msg) {
    const label = input.closest('.field');
    label.classList.add('field--error');
    label.classList.remove('field--valid');
    const err = label.nextElementSibling;
    if (err?.classList.contains('field__error')) err.textContent = msg;
  }

  function setValid(input) {
    const label = input.closest('.field');
    label.classList.remove('field--error');
    label.classList.add('field--valid');
    const err = label.nextElementSibling;
    if (err?.classList.contains('field__error')) err.textContent = '';
  }

  function validateName() {
    const val = fields.name.value.trim();
    if (!val) { setError(fields.name, '// NAME_REQUIRED'); return false; }
    setValid(fields.name);
    return true;
  }

  function validateEmail() {
    const val = fields.email.value.trim();
    if (!val)                         { setError(fields.email, '// EMAIL_REQUIRED'); return false; }
    if (!fields.email.checkValidity()) { setError(fields.email, '// EMAIL_INVALID');  return false; }
    setValid(fields.email);
    return true;
  }

  function validateMessage() {
    const val = fields.message.value.trim();
    if (!val)                { setError(fields.message, '// MESSAGE_REQUIRED');                    return false; }
    if (val.length < MSG_MIN) { setError(fields.message, `// TOO_SHORT — min ${MSG_MIN} chars`); return false; }
    if (val.length > MSG_MAX) { setError(fields.message, `// TOO_LONG — max ${MSG_MAX} chars`);  return false; }
    setValid(fields.message);
    return true;
  }

  form.addEventListener('submit', e => {
    const ok = [validateName(), validateEmail(), validateMessage()].every(Boolean);
    if (!ok) {
      e.preventDefault();
      form.querySelector('.field--error .field__input')?.focus();
    }
  });

  setup();
})();
