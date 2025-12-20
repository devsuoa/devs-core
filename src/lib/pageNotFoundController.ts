export const onPageNotFound = (navigate?: (path: string) => void) => {
    if (navigate) {
        navigate("/404");
    } else {
        window.location.href = "/404";
    }
  };
  