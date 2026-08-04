/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakColor, TweakSelect, TweakRadio */

const FUEGO_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "gold": "#c89a52",
  "headlineFont": "DM Serif Display",
  "density": "editorial"
}/*EDITMODE-END*/;

const GOLD_RAMPS = {
  "#c89a52": { deep: "#a67c39", soft: "#e3c489" },
  "#d9a441": { deep: "#b3832c", soft: "#f0c879" },
  "#bd8b3f": { deep: "#9a6f2c", soft: "#dcb56e" },
  "#caa66a": { deep: "#a98a4c", soft: "#e8d2a0" }
};

const DENSITY_PAD = { compact: "96px", editorial: "132px", grand: "168px" };

function FuegoTweaks() {
  const [t, setTweak] = useTweaks(FUEGO_TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    const ramp = GOLD_RAMPS[t.gold] || GOLD_RAMPS["#c89a52"];
    r.setProperty("--gold", t.gold);
    r.setProperty("--gold-deep", ramp.deep);
    r.setProperty("--gold-soft", ramp.soft);
    r.setProperty("--font-display", '"' + t.headlineFont + '", Georgia, serif');
    r.setProperty("--pad-section", DENSITY_PAD[t.density] || DENSITY_PAD.editorial);
  }, [t.gold, t.headlineFont, t.density]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand" />
      <TweakColor
        label="Gold accent"
        value={t.gold}
        options={["#c89a52", "#d9a441", "#bd8b3f", "#caa66a"]}
        onChange={(v) => setTweak("gold", v)}
      />
      <TweakSection label="Typography" />
      <TweakSelect
        label="Headline font"
        value={t.headlineFont}
        options={["DM Serif Display", "Cormorant Garamond", "Libre Caslon Display"]}
        onChange={(v) => setTweak("headlineFont", v)}
      />
      <TweakSection label="Layout" />
      <TweakRadio
        label="Spacing"
        value={t.density}
        options={["compact", "editorial", "grand"]}
        onChange={(v) => setTweak("density", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<FuegoTweaks />);
