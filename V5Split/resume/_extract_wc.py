# temp helper — delete after use
s = open("index.html", "r", encoding="utf-8", errors="replace").read()
i = s.find('id="wcScrollDriver"')
j = s.find('id="cards-wrap"')
open("_structure_snip.txt", "w", encoding="utf-8").write(s[max(0, i - 300) : j + 1200])
print("wrote", i, j)
