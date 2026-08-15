# Common Git Commands Cheat Sheet

![img](./assets/bg2015120901.png)

- Workspace: the working directory
- Index / Stage: the staging area
- Repository: the repository (or local repository)
- Remote: the remote repository

## Creating a Repository

```bash
# Initialize a Git repository in the current directory
$ git init

# Create a new directory and initialize it as a Git repository
$ git init [project-name]

# Download a project and its entire history
$ git clone [url]
```

## Configuration

Git's settings file is `.gitconfig`. It can live in your home directory (global config) or in a project directory (project config).

```bash
# Show the current Git configuration
$ git config --list

# Edit the Git configuration file
$ git config -e [--global]

# Set the user info used when committing code
$ git config [--global] user.name "[name]"
$ git config [--global] user.email "[email address]"
```

## Generate an SSH key

```bash
ssh-keygen -t rsa -C "your-email@address.com" -f filename
```

## Adding / Removing Files

```bash
# Add the specified files to the staging area
$ git add [file1] [file2] ...

# Add the specified directory to the staging area, including subdirectories
$ git add [dir]

# Add all files in the current directory to the staging area
$ git add .

# Prompt for confirmation before each change is added
# Useful for committing multiple changes to the same file separately
$ git add -p

# Remove files from the working directory and stage the removal
$ git rm [file1] [file2] ...

# Stop tracking a file, but keep it in the working directory
$ git rm --cached [file]

# Rename a file and stage the rename
$ git mv [file-original] [file-renamed]
```

## Committing Code

```bash
# Commit the staging area to the repository
$ git commit -m [message]

# Commit the specified files from the staging area to the repository
$ git commit [file1] [file2] ... -m [message]

# Commit all changes in the working directory since the last commit, straight to the repository
$ git commit -a

# Show all diff information while committing
$ git commit -v

# Replace the last commit with a new one
# If there are no new changes, used to rewrite the last commit message
$ git commit --amend -m [message]

# Redo the last commit, including new changes to the specified files
$ git commit --amend [file1] [file2] ...
```

## Branches

```bash
# List all local branches
$ git branch

# List all remote branches
$ git branch -r

# List all local and remote branches
$ git branch -a

# Create a new branch but stay on the current one
$ git branch [branch-name]

# Create a new branch and switch to it
$ git checkout -b [branch]

# Create a new branch pointing at a specific commit
$ git branch [branch] [commit]

# Create a new branch and set up tracking with a specified remote branch
$ git branch --track [branch] [remote-branch]

# Switch to the specified branch and update the working directory
$ git checkout [branch-name]

# Switch to the previous branch
$ git checkout -

# Set up a tracking relationship between an existing branch and a remote branch
$ git branch --set-upstream [branch] [remote-branch]

# Merge the specified branch into the current branch
$ git merge [branch]

# Cherry-pick a commit into the current branch
$ git cherry-pick [commit]

# Delete a branch
$ git branch -d [branch-name]

# Delete a remote branch
$ git push origin --delete [branch-name]
$ git branch -dr [remote/branch]
```

## Tags

```bash
# List all tags
$ git tag

# Create a new tag at the current commit
$ git tag [tag]

# Create a new tag at a specified commit
$ git tag [tag] [commit]

# Delete a local tag
$ git tag -d [tag]

# Delete a remote tag
$ git push origin :refs/tags/[tagName]

# View tag information
$ git show [tag]

# Push a specific tag
$ git push [remote] [tag]

# Push all tags
$ git push [remote] --tags

# Create a new branch pointing at a tag
$ git checkout -b [branch] [tag]
```

## Viewing Information

```bash
# Show files with changes
$ git status

# Show the commit history of the current branch
$ git log

# Show the commit history and the files changed in each commit
$ git log --stat

# Search commit history by keyword
$ git log -S [keyword]

# Show all changes after a certain commit, one commit per line
$ git log [tag] HEAD --pretty=format:%s

# Show all changes after a certain commit whose "commit message" matches the search condition
$ git log [tag] HEAD --grep feature

# Show the version history of a file, including renames
$ git log --follow [file]
$ git whatchanged [file]

# Show every diff related to a specified file
$ git log -p [file]

# Show the last 5 commits
$ git log -5 --pretty --oneline

# Show all users who have committed, sorted by number of commits
$ git shortlog -sn

# Show who modified a file and when
$ git blame [file]

# Show the difference between the staging area and the working directory
$ git diff

# Show the difference between the staging area and the last commit
$ git diff --cached [file]

# Show the difference between the working directory and the latest commit of the current branch
$ git diff HEAD

# Show the difference between two commits
$ git diff [first-branch]...[second-branch]

# Show how many lines of code you wrote today
$ git diff --shortstat "@{0 day ago}"

# Show the metadata and content changes of a commit
$ git show [commit]

# Show the files changed in a commit
$ git show --name-only [commit]

# Show the content of a file at a certain commit
$ git show [commit]:[filename]

# Show the most recent commits of the current branch
$ git reflog
```

## Remote Sync

```bash
# Download all changes from a remote repository
$ git fetch [remote]

# Show all remote repositories
$ git remote -v

# Show information about a remote repository
$ git remote show [remote]

# Add a new remote repository and give it a name
$ git remote add [shortname] [url]

# Fetch changes from the remote repository and merge them into the local branch
$ git pull [remote] [branch]

# Push the specified local branch to the remote repository
$ git push [remote] [branch]

# Force push the current branch to the remote repository, even with conflicts
$ git push [remote] --force

# Push all branches to the remote repository
$ git push [remote] --all
```

## Undoing Changes

```bash
# Restore the specified file from the staging area to the working directory
$ git checkout [file]

# Restore a file at a certain commit to both the staging area and working directory
$ git checkout [commit] [file]

# Restore all files in the staging area to the working directory
$ git checkout .

# Reset the specified file in the staging area to match the last commit, leaving the working directory unchanged
$ git reset [file]

# Reset both the staging area and working directory to match the last commit
$ git reset --hard

# Reset the current branch pointer to a specified commit, and reset the staging area, but leave the working directory unchanged
$ git reset [commit]

# Reset the HEAD of the current branch to a specified commit, and reset both the staging area and working directory to match it
$ git reset --hard [commit]

# Reset the current HEAD to a specified commit, but keep the staging area and working directory unchanged
$ git reset --keep [commit]

# Create a new commit that undoes a specified commit
# All changes of the latter are canceled out by the former and applied to the current branch
$ git revert [commit]

# Temporarily stash uncommitted changes, then restore them later
$ git stash
$ git stash pop
```

## Other

```bash
# Generate an archive for release
$ git archive
```

### Commit code with automatic timestamps

- **Configure an alias**: run the following command in your terminal to create an alias named `ct` (commit with time)

  ```bash
  git config --global alias.ct '!git commit -m "Commit at $(date +%Y-%m-%d\ %H:%M:%S)"'
  ```

  > **Note**: this command **overwrites** your manually entered commit message. If you want to keep a custom message, use the more flexible version below:
  >
  > ```bash
  > git config --global alias.tcommit '!f() { git commit -m "$(date +\"%Y-%m-%d %H:%M:%S\") $*"; }; f'
  > ```

- **Usage**:

    - For the first alias, just run `git ct` to commit; the message is generated automatically.
    - For the second alias, run `git tcommit <your message>` and the timestamp is automatically prepended to your message.


