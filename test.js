// @flow

import { nonr, AES, Hash, Hashes, h as React } from "../imports.js"
import { history } from "../history.js"
import nonMaybe from "../../public/nonMaybe.js"
import setTitle from "../setTitle.js"
import getCommitValue from "../../public/getCommitValue.js"
import serverMetadata from "../../public/serverMetadata.js"

function getMessage() {
  const messageInput: HTMLInputElement = (nonMaybe(document.getElementById("message-input")): any)
  return messageInput?.value ?? ""
}

function getPassword() {
  const passwordInput: HTMLInputElement = (nonMaybe(document.getElementById("password-input")): any)
  return passwordInput?.value ?? ""
}

function getIsPrivate() {
  const privateRadio: HTMLInputElement = (nonMaybe(document.getElementById("private-radio")): any)
  return privateRadio?.checked
}

let inFlight = false
let inFlightStartTime
function setInFlight(page: HTMLElement, button: HTMLElement) {
  page.setAttribute("class", "disappear")
  requestAnimationFrame(() => {
    page.style.opacity = "0"
  })

  inFlight = true
  inFlightStartTime = Date.now()
  const messageInput = nonMaybe(document.getElementById("message-input"))
  const passwordInput = nonMaybe(document.getElementById("password-input"))
  messageInput?.setAttribute("disabled", "")
  passwordInput?.setAttribute("disabled", "")
  button.setAttribute("disabled", "")
}

async function unsetInFlight(button: HTMLElement) {
  return new Promise((resolve, reject) => {
    inFlight = false
    // $FlowFixMe
    const disappearTime: number = getComputedStyle(document.body).getPropertyValue("--disappear-time").slice(0, -2)
    const elapsedTime = Date.now() - inFlightStartTime
    const remainingTime = disappearTime - elapsedTime
    setTimeout(() => {
      setTimeout(() => {
        const messageInput = document.getElementById("message-input")
        const passwordInput = document.getElementById("password-input")
        messageInput?.removeAttribute("disabled")
        passwordInput?.removeAttribute("disabled")
        button.removeAttribute("disabled")
      }, 100) // allow possible page navigation to happen after await is done, so that there is no flicker.
      resolve()
    }, remainingTime)
  })
}

async function getBody() {
  const message = getMessage()
  const password = getPassword()
  const isPrivate = getIsPrivate()

  const encrypted = await AES.encryptEasy(message, password)

  const hash = await Hash.hash(password, Hashes.SHA_256)

  const privateBody = {
    message_aes: encrypted,
    key_sha: hash,
    isPrivate,
  }
  // const publicBody = {
  //   message,
  //   url,
  //   isPrivate
  // }
  return privateBody
}

async function getServerValue(): Promise<{ ... }> {
  const body = await getBody()
  const commitValue = await getCommitValue(body, serverMetadata)
  return commitValue
}

const checkEnter = (e: KeyboardEvent) => {
  const enterable = (e.target: any).type !== "textarea" || e.ctrlKey
  if (enterable && e.keyCode === 13) {
    // enter
    send()
  }
}

const updatePrivacy = () => {
  const isPrivate = getIsPrivate()
  const passwordInput = nonMaybe(document.getElementById("password-input"))
  if (!isPrivate) {
    passwordInput?.setAttribute("disabled", "")
  } else {
    passwordInput?.removeAttribute("disabled")
  }
  updateOutput()
}

const updateOutput = () => {
  const isPrivate = getIsPrivate()
  const message = getMessage()

  if (isPrivate) {
    Promise.resolve().then(async () => {
      const body = await getServerValue()

      const serverValueOutput: HTMLInputElement = (nonMaybe(document.getElementById("server-value")): any)
      serverValueOutput.value = JSON.stringify(body, null, "  ")
    })
  } else {
    const serverValueOutput: HTMLInputElement = (nonMaybe(document.getElementById("server-value")): any)
    serverValueOutput.value = message
  }
}

const send = () => {
  if (inFlight) return
  const sendButton = nonMaybe(document.getElementById("send-button"))
  const form = nonMaybe(document.getElementById("form"))
  setInFlight(form, sendButton)
  console.info("send")
  const password = getPassword()
  Promise.resolve().then(async () => {
    let data
    let body
    try {
      body = await getBody()

      console.info("sending", body)

      const res = await fetch(`/commit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      })
      data = await res.json()
      console.info("confirmation", data)
    } catch (err) {
      console.error(err)
    } finally {
      const sendButton = nonMaybe(document.getElementById("send-button"))
      await unsetInFlight(sendButton)
      const url = window.location.origin + "/" + (data?.key_sha ?? "") + "#" + password
      window.history.pushState({ key_sha: body?.key_sha }, "", url)
      // window.location.href = window.location.origin + '/' + (data?.key_sha ?? '') + '#' + password
    }
  })
}

let _mounted = false
function handlePageLoad() {
  console.warn("send load", window.location.href)
  _mounted = true
  setTitle()
  handleAnimation()

  const motd = `# Welcome to cult.sh.

1. Enter message.
2. Lock using a key.
3. Send.
4. Unlock using cult.sh#key.

## Privacy Policy
A hash of your IP address is your identity.
Multiple people may have the same identity.
Identity is stored indefinitely, but not IP address.
Identity is used for throttling among other things.
Posted messages are stored indefinitely.
The URL's #key is not sent to the server.`

  const messageInput = nonMaybe(document.getElementById("message-input"))
  messageInput.setAttribute("placeholder", motd)

  updateOutput()
}

function handleAnimation() {
  requestAnimationFrame(() => {
    // can't change style on first frame reliably
    const read = document.getElementById("read")
    if (read) {
      read.removeAttribute("style")
      read.setAttribute("class", "appear-slow")
    }

    const form = nonMaybe(document.getElementById("form"))
    form.style.display = "block"
    requestAnimationFrame(() => {
      form.style.opacity = "1"
      // form.style.transform = 'scale(1)'
      form.style.transform = "translateY(0)"
    })
  })
}

// nonr(() => {
//   // $FlowFixMe
//   history()
//   if (!_mounted) return
//
//   // reacts to changes in history.location
//   if (history.location.pathname === '/') {
//     handlePageLoad()
//   }
// })

const sendPage: any = () => (
  <div id="form" className="appear-default">
    <div>
      <div /*asdasd*/ className="flex field text-field">
        <span>Message</span>
        <textarea
          id="message-input" /*sadasd*/
          className="textarea"
          rows="8"
          maxLength="2000"
          onInput={updateOutput}
          onKeyDown={(event) => checkEnter(event)}></textarea>
      </div>
      <div className="flex row spaced radio-field">
        <div>
          <input checked={true} type="radio" id="private-radio" name="privacy" value="private"
                 onChange={updatePrivacy}/>
          <span>Private</span>
        </div>
        <div>
          <input disabled={true} type="radio" id="public-radio" name="privacy" value="public" onChange={updatePrivacy}/>
          <span>Public</span>
        </div>
      </div>
      <div className="flex field text-field">
        <span>Key</span>
        <input
          id="password-input"
          type="text"
          minLength="3"
          onInput={updateOutput}
          onKeyDown={(e) => checkEnter(e)}/>
      </div>
    </div>

    <div className="flex field text-field">
      <span>Server Value</span>
      <div className="flex row">
        <textarea id="server-value" className="textarea" style="width: 100%" rows="9" disabled={true}></textarea>
      </div>
    </div>
    <div id="send-row" className="flex row spaced">
      <div style="flex: 1"></div>
      <span id="send-row-ip-label" style="opacity: 0.3">
        IP Controlled
      </span>
      <button id="send-button" className="button" onClick={send}>
        Send
      </button>
    </div>
  </div>
)

const element: HTMLElement = sendPage()

export default {
  html: element,
  onMount: handlePageLoad,
}
