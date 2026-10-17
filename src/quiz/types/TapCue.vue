<template>
  <p class="tapcue"><i /><span><slot /></span></p>
</template>

<style scoped>
.tapcue {
  margin: 4px 0 0;
  color: var(--accent);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  display: inline-block;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: no-preference) {
  i {
    animation: pulse 1.2s ease-in-out infinite;
  }
}
</style>
