<div>
  {a.map((props) => (<span {...props}>{props.children}</span>))}
  {a.map((props) => (<span {...props()}>{props.children}</span>))}
</div>