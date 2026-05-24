const TAPKIT_MCP_URL = "https://mcp.tapkit.ai/mcp";

export const TapKitLocalPlugin = async ({ client }: any) => {
  try {
    await client.app.log({
      body: {
        service: "tapkit",
        level: "info",
        message: `TapKit local OpenCode plugin loaded. MCP server: ${TAPKIT_MCP_URL}`,
      },
    });
  } catch {
    // Logging is best-effort and should never block plugin loading.
  }

  return {
    "experimental.session.compacting": async (_input: unknown, output: { context: string[] }) => {
      output.context.push(
        [
          "## TapKit",
          "",
          "Use the TapKit MCP server and bundled TapKit skills for iPhone-control tasks. Start with phone discovery, pass `phone_id` on each TapKit call, and use the screenshot -> act -> screenshot verification loop.",
        ].join("\n"),
      );
    },
  };
};

export default TapKitLocalPlugin;
