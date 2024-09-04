window.semanticForms = () => {
  // do some feature detection so none of the JS executes if the browser is too old
  if (typeof document.getElementsByClassName !== 'function' || typeof document.querySelector !== 'function' || !document.body.classList || !window.MutationObserver) return

  const nodeNameLookup = ['TEXTAREA', 'SELECT']
  const typeLookup = ['checkbox', 'color', 'date', 'datetime-local', 'email', 'file', 'image', 'month', 'number', 'password', 'radio', 'range', 'search', 'tel', 'text', 'time', 'url', 'week']

  // progressively enhance form elements that have the semanticForms class
  const forms = document.querySelectorAll('form.semanticForms:not(.semanticFormsActive)')

  for (const form of forms) {
    form.classList.add('semanticFormsActive')

    // collect all form elements
    const inputs = Array.from(form.querySelectorAll('input, textarea, select'))

    if (form.classList.contains('lowFlow')) {
      for (const input of inputs) {
        const dl = input.closest('dl')
        const dt = input.closest('dd')?.previousElementSibling
        const dd = input.closest('dd')

        if (dt && dt.nodeName === 'DT' && dd.nodeName === 'DD') {
          // removes old div that a radio or checkbox may have been added to
          if (dd.parentElement.nodeName === 'DIV') {
            dd.parentElement.remove()
          }

          const div = document.createElement('div')
          div.append(dt, dd)
          dl.append(div)
        }
      }
      console.log('low flow')
      continue
    }

    const clearfieldHorizontalOffset = parseInt(form.getAttribute('data-clearfield-horizontal-offset')) || 21
    const clearfieldVerticalOffset = parseInt(form.getAttribute('data-clearfield-vertical-offset')) || 5

    for (const input of inputs) {
      // check if input has already been formatted
      if (input.classList.contains('semanticform') || !input.id) continue

      const type = input.getAttribute('type')

      if (nodeNameLookup.includes(input.nodeName) || typeLookup.includes(type)) {
        const dl = input.closest('dl')
        dl.classList.toggle('floatLabelForm', true)

        let label

        if (input.parentNode.parentNode.id && (type === 'checkbox' || type === 'radio')) {
          label = document.querySelector('label[data-for=' + input.parentNode.parentNode.id.replace(/\./g, '\\.') + ']')
        } else {
          label = document.querySelector('label[for=' + input.id.replace(/\./g, '\\.') + ']')
        }

        input.classList.add('semanticform')

        // checkboxes and radios
        if (type === 'checkbox' || type === 'radio') {
          const dd = input.closest('dd')
          if (dd.firstChild.nodeName !== 'LABEL') {
            const newLabel = document.createElement('label')
            newLabel.className = 'floatLabelFormAnimatedLabel'

            if (type === 'checkbox' && input.parentNode.nodeName === 'DD') {
              newLabel.setAttribute('for', input.id)
              input.parentNode.classList.add('singleCheckbox')
              newLabel.className = ''
              label.setAttribute('hidden', 'hidden')
            }

            newLabel.innerHTML = label.innerHTML
            if (!dd.querySelector('label')) {
              dd.append(newLabel)
            }
          }

          const div = document.createElement('div')
          // removes old div that a radio or checkbox may have been added to
          if (dd.parentElement.nodeName === 'DIV') {
            dd.parentElement.remove()
          }
          div.append(label.closest('dt'), dd)
          dl.append(div)
        } else {
          const newLabel = document.createElement('label')
          newLabel.setAttribute('for', input.id)
          newLabel.className = 'floatLabelFormAnimatedLabel'
          newLabel.innerHTML = label.innerHTML
          label.setAttribute('hidden', 'hidden')
          insertAfter(newLabel, input)
        }

        // standard inputs
        if (input.nodeName !== 'SELECT' && type !== 'checkbox' && type !== 'radio') {
          if (!input.getAttribute('placeholder')) input.setAttribute('placeholder', ' ')
          inputHandler(input) // force x to appear on inputs with prefilled value
        }

        if (type !== 'checkbox' && type !== 'radio') {
          const div = document.createElement('div')
          div.append(label.closest('dt'), input.closest('dd'))
          dl.append(div)
        }

        input.addEventListener('input', inputHandler)
        input.addEventListener('mousemove', event => {
          const el = event.target

          if (el.nodeName === 'TEXTAREA' || typeLookup.includes(el.getAttribute('type'))) {
            inputHandler(event)
            if (el.offsetWidth - clearfieldHorizontalOffset < event.clientX - el.getBoundingClientRect().left && clearfieldHorizontalOffset + clearfieldVerticalOffset > event.clientY - el.getBoundingClientRect().top
            ) {
              if (!el.classList.contains('onX')) {
                el.classList.add('onX')
              }
            } else {
              el.classList.remove('onX')
            }
          }
        })
        input.addEventListener('click', event => {
          const el = event.target
          if (el.nodeName === 'TEXTAREA' || typeLookup.includes(el.getAttribute('type'))) {
            if (el.offsetWidth - clearfieldHorizontalOffset < event.clientX - el.getBoundingClientRect().left &&
                  clearfieldHorizontalOffset + clearfieldVerticalOffset > event.clientY - el.getBoundingClientRect().top
            ) {
              el.value = ''
              el.dispatchEvent(new Event('input'))
              el.form.dispatchEvent(new Event('input'))
              el.classList.remove('x')
              el.classList.remove('onX')
            }
          }
        })
      }
    }
  }

  // handle keystrokes or other input
  function inputHandler (event) {
    const el = event.target || event
    const nodeName = el.nodeName
    const type = el.getAttribute('type') || nodeName === 'TEXTAREA'
    if ((nodeName && type) && (nodeName === 'TEXTAREA' || typeLookup.includes(type))) {
      if (el.value) {
        if (!el.classList.contains('x')) {
          el.classList.add('x')
        }
      } else {
        el.classList.remove('x')
      }
    }
  }

  // utility method for inserting an element after another element
  function insertAfter (newNode, referenceNode) {
    if (referenceNode.nextSibling) referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    else referenceNode.parentNode.appendChild(newNode)
  }

  // monitor changes to the DOM and enhance new semanticForms forms that get added
  if (!window.semanticFormsObserver) {
    window.semanticFormsObserver = new window.MutationObserver((mutations) => {
      let stop = false
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'FORM') {
            window.semanticForms()
            stop = true
          }
        }
        if (stop) break
      }
    })
    window.semanticFormsObserver.observe(document.body, { attributes: false, childList: true, characterData: false, subtree: true })
  }
}

window.semanticForms.reinitialize = (form) => {
  form.classList.remove('semanticFormsActive')
  window.semanticForms()
}
