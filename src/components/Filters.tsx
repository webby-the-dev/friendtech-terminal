import { Button, Flex, Grid, Input, Text } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { FilterType } from "../types";

interface FiltersProps {
  searchString: string;
  setSearchString: Dispatch<SetStateAction<string>>;
  filters: FilterType[];
  updateFilters: Dispatch<SetStateAction<FilterType[]>>;
}

export const Filters = (props: FiltersProps) => {
  const { searchString, setSearchString, filters, updateFilters } = props;

  const handleFollowersFilter = (filter: FilterType) => {
    updateFilters((prev) => {
      let newFilters = [...prev];
      newFilters = newFilters.filter(
        (f) => f !== "all" && f !== "5k" && f !== "10k"
      );
      newFilters.push(filter);
      return newFilters;
    });
  };

  return (
    <Grid gap={2} p={2}>
      <Text>Filters</Text>
      <Input
        size="sm"
        placeholder="Search feed"
        value={searchString}
        onChange={(e) => setSearchString(e.target.value)}
      />

      <Flex gap={2} alignItems="center">
        <Text>Followers:</Text>
        <FilterButton
          name="all"
          isSelected={filters.includes("all")}
          onChange={handleFollowersFilter}
        />

        <FilterButton
          name="5k"
          isSelected={filters.includes("5k")}
          onChange={handleFollowersFilter}
        />
        <FilterButton
          name="10k"
          isSelected={filters.includes("10k")}
          onChange={handleFollowersFilter}
        />
      </Flex>
    </Grid>
  );
};

interface FilterButtonProps {
  name: FilterType;
  isSelected: boolean;
  onChange: (filter: FilterType) => void;
}

const FilterButton = (props: FilterButtonProps) => {
  const { name, isSelected, onChange } = props;
  return (
    <Button
      size="sm"
      bgColor={isSelected ? "green.400" : "white"}
      onClick={() => onChange(name)}
      _hover={{ bgColor: isSelected ? "green.400" : "white" }}
    >
      {name}
    </Button>
  );
};
