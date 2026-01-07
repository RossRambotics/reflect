export type RobotTopProps = React.SVGAttributes<SVGSVGElement> & {
  bumperColor?: string;
};

export const RobotTop = ({ bumperColor = "current", ...props }: RobotTopProps) =>
  // prettier-ignore
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" {...props}>
    <path fill={bumperColor} stroke="current" d="M.5 4A3.5 3.5 0 0 1 4 .5h92A3.5 3.5 0 0 1 99.5 4v92a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 96V4ZM10 8.5A1.5 1.5 0 0 0 8.5 10v80a1.5 1.5 0 0 0 1.5 1.5h80a1.5 1.5 0 0 0 1.5-1.5V10A1.5 1.5 0 0 0 90 8.5H10Z"/>
    <path stroke="current" fill="none" d="M1 14h7M1 50h7m84 0h7M1 86h7m84 0h7m-7-72h7M86 1v7M14 1v7m19-7v7m34-7v7M33 92v7m34-7v7m-53-7v7m72-7v7" strokeLinecap="round"/>
    <rect fill="current" stroke="none" width="82" height="82" x="9" y="9" rx="1"/>
    <path stroke="current" fill="none" d="M9.5 11.5h.5c.552 0 .5-.052.5.5v12c0 .552.052.5-.5.5h-.5v-13Z"/>
    <path fill="current" stroke="none" d="M10 12.5H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Z" fillRule="evenodd" clipRule="evenodd"/>
    <path stroke="current" fill="none" d="M9.5 43.501h.5c.552 0 .5-.052.5.5v12c0 .553.052.5-.5.5h-.5v-13Z"/>
    <path fill="current" stroke="none" d="M10 44.501H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Z" fillRule="evenodd" clipRule="evenodd"/>
    <path stroke="current" fill="none" d="M9.5 75.501h.5c.552 0 .5-.052.5.5v12c0 .553.052.5-.5.5h-.5v-13Z"/>
    <path fill="current" stroke="none" d="M10 76.501H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Zm0 2H9v-1h1a.5.5 0 0 1 0 1Z" fillRule="evenodd" clipRule="evenodd"/>
    <path stroke="current" fill="none" d="M90.5 11.5H90c-.552 0-.5-.052-.5.5v12c0 .552-.052.5.5.5h.5v-13Z"/>
    <path fill="current" stroke="none" d="M90 12.5h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Z" fillRule="evenodd" clipRule="evenodd"/>
    <path stroke="current" fill="none" d="M90.5 43.501H90c-.552 0-.5-.052-.5.5v12c0 .553-.052.5.5.5h.5v-13Z"/>
    <path fill="current" stroke="none" d="M90 44.501h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Z" fillRule="evenodd" clipRule="evenodd"/>
    <path stroke="current" fill="none" d="M90.5 75.501H90c-.552 0-.5-.052-.5.5v12c0 .553-.052.5.5.5h.5v-13Z"/>
    <path fill="current" stroke="none" d="M90 76.501h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Zm0 2h1v-1h-1a.5.5 0 0 0 0 1Z" fillRule="evenodd" clipRule="evenodd"/>
    <path stroke="current" fill="none" d="M48.268 32c.77-1.333 2.694-1.333 3.464 0l14.74 25.531c1.101 1.906-1.235 3.933-2.967 2.573l-12.27-9.634a2 2 0 0 0-2.47 0l-12.27 9.634c-1.731 1.36-4.068-.667-2.968-2.573L48.267 32Z"/>
  </svg>;
