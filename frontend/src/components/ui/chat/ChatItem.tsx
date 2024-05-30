"use client";
import * as React from 'react';
import Box from '@mui/joy/Box';
import ListDivider from '@mui/joy/ListDivider';
import ListItem from '@mui/joy/ListItem';
import ListItemButton, { ListItemButtonProps } from '@mui/joy/ListItemButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import AvatarWithStatus from '../AvatarWithStatus';
import { toggleMessagesPane } from '@/components/utils';
import { CircleRounded } from '@mui/icons-material';
import { Chip } from '@mui/joy';

type ChatListItemProps = ListItemButtonProps & {
  socket: any;
  id: string;
  unread?: boolean;
  sender: string;
  messages: string;
  selectedChatId?: string;
  setSelectedChat: (chat: any) => void;
};

export default function ChatItem(props: ChatListItemProps) {
  const { socket, id, sender, messages, selectedChatId, setSelectedChat } = props;
  const selected = selectedChatId === id;

 
  return (
    <React.Fragment>
      <ListItem >
        <ListItemButton
          onClick={() => {
            toggleMessagesPane();
            setSelectedChat({ id ,userId: id, title: sender});
          }}
          selected={selected}
          color="neutral"
          sx={{
            flexDirection: 'column',
            alignItems: 'initial',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <AvatarWithStatus  src={sender} />
            <Box sx={{ flex: 1 }}>
              <Typography level="title-sm">{sender}</Typography>
              {/* <Typography level="body-sm">{sender.username}</Typography> */}
            </Box>
            <Box
              sx={{
                lineHeight: 1.5,
                textAlign: 'right',
              }}
            >
              { props.unread ? (
                <Chip 
                  variant="solid" 
                  color="primary" 
                  size="sm" 
                 
                >
                  {/* {props.unread} */}
                </Chip>
              ) : null
            }
              <Typography
                level="body-xs"
                display={{ xs: 'none', md: 'block' }}
                noWrap
              >
                {/* 5 mins ago */}
              </Typography>
            </Box>
          </Stack>
          <Typography
            level="body-sm"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              
            }}
          >
            {messages}
          </Typography>
        </ListItemButton>
      </ListItem>
      <ListDivider sx={{ margin: 0 }} />
    </React.Fragment>
  );
}