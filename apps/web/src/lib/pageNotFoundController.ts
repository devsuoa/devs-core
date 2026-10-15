import { NavigateFunction } from "react-router-dom";

let navigateRef: NavigateFunction | null = null;

export function registerNavigator(navigate: NavigateFunction) {
  navigateRef = navigate;
}

export function onPageNotFound() {
  if (navigateRef) {
    navigateRef("/404", { replace: true });
  }
}
