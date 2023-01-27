const sendPage: any = () => (
  <div id="send-row" className="flex row spaced">
    <span id="send-row-ip-label" style="opacity: 0.3">
        IP Controlled
      </span>
    <button id="send-button" className="button" onClick={send}>
      Send
    </button>
  </div>
)