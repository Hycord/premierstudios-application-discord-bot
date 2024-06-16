import { SubCommand, SubCommandData } from "../../lib/Discord/SubCommand";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Embed,
  EmbedBuilder,
} from "discord.js";

export class Deny extends SubCommand {
  constructor() {
    super({
      name: "deny",
      description: 'Deny a suggestion and mark it as "will NOT be implemented"',
      defer: true,
      ephemeral: true,
      developerOnly: false,
    });

    this.addIntegerOption((o) =>
      o
        .setName("id")
        .setDescription("Which suggestion would you like to deny?")
        .setRequired(true)
    );
  }

  override async execute({ client, executor, interaction }: SubCommandData) {
    const id = interaction.options.getInteger("id", true);

    const data = await client.prisma.suggestion.findUnique({
      where: { id },
    });

    if (!data) {
      return await interaction.editReply({
        content: `Unable to process data for suggestion with ID ${id}. Please try again!`,
      });
    }

    if (data.status != "UNREVIEWED") {
      return await interaction.editReply({
        content: "This suggestion has already been reviewed.",
      });
    }
    const channel = await client.channels.fetch(data.channelId);
    if (!channel || !channel.isTextBased()) throw null;
    const message = await channel.messages.fetch(data.messageId as any);

    if (!message || !message.embeds[0]) {
      return await interaction.editReply({
        content: "Unable to fetch suggestion. Please try again later!",
      });
    }

    const cancelButton = new ButtonBuilder();
    cancelButton.setCustomId(`cancel~1`); // ~1 specifies that we want to also delete the message attached to the interaction
    cancelButton.setLabel("Cancel");
    cancelButton.setStyle(ButtonStyle.Danger);

    const denyButton = new ButtonBuilder();
    denyButton.setCustomId(`denySuggestion~${data.id}`);
    denyButton.setLabel("Deny");
    denyButton.setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents(cancelButton, denyButton);

    await interaction.editReply({
      components: [row],
      embeds: [message.embeds[0]],
    });
  }
}
