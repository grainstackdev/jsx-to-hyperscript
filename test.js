const test = (
  <div style={{ color: "orange" }}>
    <button
      onClick={() => {
        const el = <div />
      }}
    />
    <Component />
    <Component props={"asda"} />
    {signs.map(renderSign)}
  </div>
)