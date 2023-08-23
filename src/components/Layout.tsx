import { Grid } from "@chakra-ui/react";
import { Analytics } from "@vercel/analytics/react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
  const { children } = props;
  return (
    <>
      <main>
        <Grid backgroundColor="#000">{children} </Grid>
        <Analytics />
      </main>
    </>
  );
};
