import '../libs/quids-in/feature-shell/app.css';
import { mount } from 'svelte';
import App from '../libs/quids-in/feature-shell/App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
