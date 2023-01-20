const test = (
  <div style={{color: 'orange'}}>
    <button onClick={() => {<div/>}} />
    <Component />
    <Component props={"asda"} />
    {signs.map(renderSign)}
  </div>
)