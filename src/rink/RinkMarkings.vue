<template>
  <rect x="0" y="0" width="850" height="2000" rx="280" fill="#f7fbff" stroke="#9fb3c4" stroke-width="6" />
  <g stroke-width="4">
    <line x1="6" y1="110" x2="844" y2="110" stroke="#d94a4a" />
    <line x1="6" y1="1890" x2="844" y2="1890" stroke="#d94a4a" />
    <rect x="3" y="740" width="844" height="20" fill="#3b7dd8" stroke="none" />
    <rect x="3" y="1240" width="844" height="20" fill="#3b7dd8" stroke="none" />
    <rect x="3" y="992" width="844" height="16" fill="#d94a4a" stroke="none" />
    <circle cx="425" cy="1000" r="150" fill="none" stroke="#3b7dd8" />
    <circle cx="425" cy="1000" r="8" fill="#3b7dd8" stroke="none" />
    <g fill="none" stroke="#d94a4a">
      <circle cx="205" cy="310" r="150" />
      <circle cx="645" cy="310" r="150" />
      <circle cx="205" cy="1690" r="150" />
      <circle cx="645" cy="1690" r="150" />
    </g>
    <g fill="#d94a4a" stroke="none">
      <circle cx="205" cy="310" r="8" />
      <circle cx="645" cy="310" r="8" />
      <circle cx="205" cy="1690" r="8" />
      <circle cx="645" cy="1690" r="8" />
      <circle cx="205" cy="800" r="8" />
      <circle cx="645" cy="800" r="8" />
      <circle cx="205" cy="1200" r="8" />
      <circle cx="645" cy="1200" r="8" />
    </g>
    <path d="M365 110 A60 60 0 0 0 485 110" fill="#bcd8f5" stroke="#d94a4a" />
    <path d="M365 1890 A60 60 0 0 1 485 1890" fill="#bcd8f5" stroke="#d94a4a" />
    <rect x="395" y="70" width="60" height="40" fill="#fff" stroke="#d94a4a" />
    <rect x="395" y="1890" width="60" height="40" fill="#fff" stroke="#d94a4a" />
  </g>
  <text x="425" y="48" text-anchor="middle" class="rink-label">Their net</text>
  <text x="425" y="1972" text-anchor="middle" class="rink-label">Your net</text>
</template>

<style scoped>
.rink-label {
  font-family: var(--display);
  font-size: 32px;
  fill: #9fb3c4;
}
</style>
