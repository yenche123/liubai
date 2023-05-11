
export function getSpecificCSSRule(val: string) {
  const styleSheets = document.styleSheets
  for(let i=0; i<styleSheets.length; i++) {
    const v = styleSheets[i]
    const rules = v.cssRules
    
    for(let j=0; j<rules.length; j++) {
      const r = rules[j]
      const res = r instanceof CSSStyleRule
      if(!res) continue
      if(r.selectorText === val) {
        return r
      }
    }
  }
  return undefined
}